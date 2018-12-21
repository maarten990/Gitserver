extern crate git2;
extern crate iron;
extern crate url;
extern crate params;
#[macro_use] extern crate lazy_static;
#[macro_use] extern crate router;
#[macro_use] extern crate serde_json;
#[macro_use] extern crate failure;

use failure::Error;
use git2::Repository;
use iron::prelude::*;
use iron::status;
use params::{Params, Value};
use std::fs;
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
    // TODO: add post argument

    let mut repo_path = REPO_DIR.clone();
    repo_path.push("foo");
    let repo = Repository::open(repo_path).unwrap();
    let msgs = git::get_commit_messages(&repo).unwrap();
    let commits = json!({ "data": msgs }).to_string();

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

    type Result<T> = std::result::Result<T, Error>;

    /// Create a new repository in the target folder.
    pub fn create_repo(path: &Path, bare: bool) -> Result<Repository> {
        if path.exists() {
            return Err(format_err!("Repository already exists"));
        }

        let repo = if bare {
            Repository::init_bare(path)
        } else {
            Repository::init(path)
        };

        Ok(repo?)
    }

    /// Delete a repository from the target folder.
    pub fn delete_repo(path: &Path) -> Result<()> {
        fs::remove_dir_all(path)?;
        Ok(())
    }

    /// Return a list of git repository names in the target folder.
    pub fn get_repositories(path: &Path) -> Result<Vec<String>> {
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
    pub fn get_commit_messages(repo: &Repository) -> Result<Vec<String>> {
        let mut walk = repo.revwalk()?;
        walk.push_head()?;

        Ok(walk.into_iter()
               .filter_map(|id| id.and_then(|id| repo.find_commit(id)).ok())
               .filter_map(|commit| commit.message().map(|msg| msg.to_owned()))
               .collect())
    }
}
