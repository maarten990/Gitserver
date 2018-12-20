extern crate git2;
extern crate iron;
#[macro_use]
extern crate router;
extern crate mount;
#[macro_use]
extern crate serde_json;
extern crate staticfile;
extern crate url;
#[macro_use]
extern crate lazy_static;
extern crate params;

use git2::Repository;
use iron::prelude::*;
use iron::status;
use params::{Params, Value};
use std::error;
use std::fmt;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

lazy_static! {
    static ref CACHE: Mutex<APICache> = Mutex::new(APICache::new());
    static ref REPO_DIR: PathBuf = PathBuf::from("./repositories");
}

struct APICache {
    repolist_dirty: bool,
    repolist: String,
}

impl APICache {
    fn new() -> APICache {
        APICache {
            repolist: "{}".to_owned(),
            repolist_dirty: true,
        }
    }
}

fn get_repositories(_req: &mut Request) -> IronResult<Response> {
    let mut api = CACHE.lock().unwrap();
    if api.repolist_dirty {
        let repos = git::get_repositories(REPO_DIR.as_path()).unwrap_or_default();
        api.repolist = json!({ "data": repos }).to_string();
        api.repolist_dirty = false;
    }

    Ok(Response::with((status::Ok, &api.repolist[..])))
}

fn get_commits(_req: &mut Request) -> IronResult<Response> {
    // TODO: add caching
    let commits = json!({ "data": vec!("Test 1", "Test 2") }).to_string();

    Ok(Response::with((status::Ok, &commits[..])))
}

fn create_repository(req: &mut Request) -> IronResult<Response> {
    let map = req.get_ref::<Params>().unwrap();

    let name = match map.find(&["name"]) {
        Some(&Value::String(ref name)) => name,
        _ => {
            return Ok(Response::with((
                status::NotFound,
                "Could not create repository. Does it already exist?",
            )))
        }
    };

    let mut repo_path = REPO_DIR.clone();
    repo_path.push(name);
    let success = git::create_repo(repo_path.as_path(), true).is_ok();
    let resp = json!({"data": {"success": success}});

    if success {
        let mut api = CACHE.lock().unwrap();
        api.repolist_dirty = true;
    }

    Ok(Response::with((status::Ok, resp.to_string())))
}

fn delete_repository(req: &mut Request) -> IronResult<Response> {
    let map = req.get_ref::<Params>().unwrap();

    let name = match map.find(&["name"]) {
        Some(&Value::String(ref name)) => name,
        _ => {
            return Ok(Response::with((
                status::NotFound,
                "Could not delete repository.",
            )))
        }
    };

    let mut repo_path = REPO_DIR.clone();
    repo_path.push(name);
    let success = git::delete_repo(repo_path.as_path()).is_ok();
    let resp = json!({"data": {"success": success}});

    if success {
        let mut api = CACHE.lock().unwrap();
        api.repolist_dirty = true;
    }

    Ok(Response::with((status::Ok, resp.to_string())))
}

fn static_handler(req: &mut Request) -> IronResult<Response> {
    let mut base_path = PathBuf::from("./html-client/build");
    let mut components = req.url.path();

    // Return index.html from the root, or when visiting a /repo/name page
    // where Javascript handles the routing.
    if (components[0] == "") || (components[0] == "repo") {
        components.clear();
        components.push("index.html");
    }

    // Convert each component of the url to a Path object and append it to the
    // base path.
    components.iter()
              .map(Path::new)
              .for_each(|p| base_path.push(p));

    if base_path.exists() {
        Ok(Response::with((status::Ok, base_path)))
    } else {
        Ok(Response::with((status::NotFound, "404")))
    }
}

// mount.mount("/", Static::new(Path::new("./html-client/build")));
fn main() {
    // ensure that the repo folder exists
    if !REPO_DIR.exists() {
        fs::create_dir_all(REPO_DIR.as_path()).unwrap();
    }

    let router = router!(
        // api calls
        repos: get "/api/get_repositories" => get_repositories,
        commits: get "/api/get_commits" => get_commits,
        create: post "/api/create_repository" => create_repository,
        delete: post "/api/delete_repository" => delete_repository,

        // static file serving as fallback
        root: get "/" => static_handler,
        page: get "/*" => static_handler,
    );

    let _server = Iron::new(router).http("localhost:3001").unwrap();
}

mod git {
    use super::*;

    type Result<T> = std::result::Result<T, GitError>;

    #[derive(Debug)]
    pub enum GitError {
        Git(git2::Error),
        FS(io::Error),
    }

    impl fmt::Display for GitError {
        fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
            match *self {
                GitError::Git(ref e) => e.fmt(f),
                GitError::FS(ref e) => e.fmt(f),
            }
        }
    }

    impl error::Error for GitError {
        fn description(&self) -> &str {
            match *self {
                GitError::Git(ref e) => e.description(),
                GitError::FS(ref e) => e.description(),
            }
        }

        fn cause(&self) -> Option<&error::Error> {
            match *self {
                GitError::Git(ref e) => Some(e),
                GitError::FS(ref e) => Some(e),
            }
        }
    }

    /// Create a new repository in the target folder.
    pub fn create_repo(path: &Path, bare: bool) -> Result<Repository> {
        if path.exists() {
            return Err(GitError::FS(io::Error::new(
                io::ErrorKind::AlreadyExists,
                "Repository already exists",
            )));
        }

        let repo = if bare {
            Repository::init_bare(path)
        } else {
            Repository::init(path)
        };

        repo.map_err(GitError::Git)
    }

    /// Delete a repository from the target folder.
    pub fn delete_repo(path: &Path) -> Result<()> {
        fs::remove_dir_all(path).map_err(GitError::FS)
    }

    /// Return a list of git repository names in the target folder.
    pub fn get_repositories(path: &Path) -> io::Result<Vec<String>> {
        let mut out: Vec<String> = Vec::new();
        for entry in fs::read_dir(path)? {
            let path = entry?.path();
            if path.is_dir() {
                match path.file_name() {
                    Some(name) => out.push(name.to_str().unwrap_or("").to_owned()),
                    None => continue,
                }
            }
        }

        Ok(out)
    }

    /// Return a list of commit messages from a repository.
    pub fn get_commit_messages(repo: &Repository) -> Vec<String> {
        let walk = repo.revwalk().unwrap();
        let mut out: Vec<String> = Vec::new();

        for id in walk {
            let id = id.unwrap();
            let b = String::from_utf8(Vec::from(id.as_bytes())).unwrap();
            out.push(b);
        }

        out
    }
}
