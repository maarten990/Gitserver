extern crate git2;
extern crate iron;
extern crate url;
extern crate params;
extern crate hex;
extern crate serde;
#[macro_use] extern crate lazy_static;
#[macro_use] extern crate router;
#[macro_use] extern crate serde_json;
#[macro_use] extern crate serde_derive;
#[macro_use] extern crate failure;

use failure::Error;
use git2::Repository;
use iron::prelude::*;
use iron::status;
use params::{Params, Value};
use serde::ser::{Serialize, Serializer, SerializeMap};
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

fn get_post_string(req: &mut Request, keys: &[&str]) -> Option<String> {
    let map = req.get_ref::<Params>().unwrap();
    match map.find(keys) {
        Some(value) => {
            match *value {
                Value::String(ref name) => Some(name.to_string()),
                _ => None,
            }
        }
        None => None,
    }
}

fn get_repository(name: &str) -> Option<Repository> {
    let mut repo_path = REPO_DIR.clone();
    repo_path.push(name);
    Repository::open(repo_path).ok()
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

fn get_commits(req: &mut Request) -> IronResult<Response> {
    // TODO: add caching

    let repo_name = match get_post_string(req, &["name"]) {
        Some(name) => name,
        None => return Ok(Response::with((status::BadRequest, "Expected string parameter `name`"))),
    };

    let commits = get_repository(&repo_name)
        .and_then(|repo| git::get_commits(&repo).ok())
        .map(|commits| json!({"data": commits}))
        .map(|payload| payload.to_string());

    match commits {
        Some(commits) => Ok(Response::with((status::Ok, &commits[..]))),
        None => Ok(Response::with((status::InternalServerError, "Could not obtain commit messages"))),
    }
}

fn get_diffs(req: &mut Request) -> IronResult<Response> {
    let repo_name = match get_post_string(req, &["name"]) {
        Some(name) => name,
        None => return Ok(Response::with((status::BadRequest, "Expected string parameter `name`"))),
    };

    let sha1 = match get_post_string(req, &["sha1"]) {
        Some(name) => name,
        None => return Ok(Response::with((status::BadRequest, "Expected string parameter `sha1`"))),
    };

    let diffs = get_repository(&repo_name)
        .and_then(|repo| git::get_diffs(&repo, &sha1).ok())
        .map(|diffs| json!({"data": diffs}))
        .map(|payload| payload.to_string());

    match diffs {
        Some(diffs) => Ok(Response::with((status::Ok, &diffs[..]))),
        None => Ok(Response::with((status::InternalServerError, "Could not obtain diffs"))),
    }
}

fn get_dirtree(req: &mut Request) -> IronResult<Response> {
    let repo_name = match get_post_string(req, &["name"]) {
        Some(name) => name,
        None => return Ok(Response::with((status::BadRequest, "Expected string parameter `name`"))),
    };

    let sha1 = match get_post_string(req, &["sha1"]) {
        Some(name) => name,
        None => return Ok(Response::with((status::BadRequest, "Expected string parameter `sha1`"))),
    };

    let tree = get_repository(&repo_name)
        .and_then(|repo| git::get_dirtree(&repo, &sha1).ok())
        .map(|tree| json!({"data": tree}))
        .map(|payload| payload.to_string());

    match tree {
        Some(tree) => Ok(Response::with((status::Ok, &tree[..]))),
        None => Ok(Response::with((status::InternalServerError, "Could not obtain directory tree"))),
    }
}

fn create_repository(req: &mut Request) -> IronResult<Response> {
    let repo_name = match get_post_string(req, &["name"]) {
        Some(name) => name,
        None => return Ok(Response::with((status::BadRequest, "Expected string parameter `name`"))),
    };

    let mut repo_path = REPO_DIR.clone();
    repo_path.push(repo_name);
    let success = git::create_repo(repo_path.as_path(), true).is_ok();
    let resp = json!({"data": {"success": success}});

    if success {
        let mut api = CACHE.lock().unwrap();
        api.repolist_dirty = true;
    }

    Ok(Response::with((status::Ok, resp.to_string())))
}

fn delete_repository(req: &mut Request) -> IronResult<Response> {
    let repo_name = match get_post_string(req, &["name"]) {
        Some(name) => name,
        None => return Ok(Response::with((status::BadRequest, "Expected string parameter `name`"))),
    };

    let mut repo_path = REPO_DIR.clone();
    repo_path.push(repo_name);
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
        diffs: get "/api/get_diffs" => get_diffs,
        dirtree: get "/api/get_dirtree" => get_dirtree,
        create: post "/api/create_repository" => create_repository,
        delete: post "/api/delete_repository" => delete_repository,

        // static file serving as fallback
        root: get "/" => static_handler,
        page: get "/*" => static_handler,
    );

    let _server = Iron::new(router).http("127.0.0.1:3001").unwrap();
}

mod git {
    use super::*;

    type Result<T> = std::result::Result<T, Error>;

    #[derive(Serialize)]
    pub struct Commit {
        pub message: String,
        pub sha1: String,
    }

    pub enum Dirtree {
        File(String),
        Dir(String, Vec<Dirtree>),
    }

    impl Serialize for Dirtree {
        fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
            where
                S: serde::Serializer {
            match self {
                Dirtree::File(name) => serializer.serialize_str(name),
                Dirtree::Dir(name, children) => {
                    let mut map = serializer.serialize_map(Some(1))?;
                    map.serialize_entry(name, children)?;
                    map.end()
                }
            }
        }
    }

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

    /// Return the diff between a commit and its parent.
    fn diff_to_parent(repo: &Repository, commit: &git2::Commit) -> Result<Vec<String>> {
        let tree = commit.tree()?;
        let parent_tree = commit.parent(0).and_then(|p| p.tree()).ok();

        let diff = repo.diff_tree_to_tree(parent_tree.as_ref(), Some(&tree), None)?;
        let mut diffs: Vec<String> = Vec::new();
        let files_changed = diff.stats()?.files_changed();
        for i in 0..files_changed {
            let mut patch = git2::Patch::from_diff(&diff, i)?;
            match patch {
                Some(mut patch) => {
                    diffs.push(String::from_utf8(patch.to_buf()?.to_owned())?);
                },
                None => {
                    diffs.push("Binary file changed.".to_owned());
                }
            }
        }

        Ok(diffs)
    }

    /// Return a list of commit messages from a repository.
    pub fn get_commits(repo: &Repository) -> Result<Vec<Commit>> {
        let mut walk = repo.revwalk()?;
        walk.push_head()?;

        Ok(walk.filter_map(|id| id.and_then(|id| repo.find_commit(id)).ok())
               .map(|commit| {
                   Commit {
                       message: commit.message().unwrap_or("error: commit has no message").to_owned(),
                       sha1: hex::encode(commit.id().as_bytes()),
                   }
               })
               .collect())
    }

    /// Return a list of diffs belonging to a specific commit.
    pub fn get_diffs(repo: &Repository, sha1: &str) -> Result<Vec<String>> {
        let oid = git2::Oid::from_str(sha1)?;
        let commit = repo.find_commit(oid)?;
        diff_to_parent(&repo, &commit)
    }

    fn fill_directory(repo: &Repository, dir: &mut Dirtree, tree: &git2::Tree) {
        let mut files = Vec::new();
        for entry in tree.iter() {
            match entry.kind().unwrap() {
                git2::ObjectType::Blob => {
                    files.push(Dirtree::File(entry.name().unwrap().to_owned()));
                },
                git2::ObjectType::Tree => {
                    let mut subtree = Dirtree::Dir (
                        entry.name().unwrap().to_owned(),
                        Vec::new(),
                    );
                    fill_directory(repo, &mut subtree,
                        &entry.to_object(repo).ok()
                            .and_then(|obj| obj.into_tree().ok()).unwrap());
                    files.push(subtree);
                },
                _ => (),
            }
        }

        match dir {
            Dirtree::Dir(_, ref mut children) => *children = files,
            Dirtree::File(_) => panic!("Expected Dirtree::Dir, got Dirtree::File"),
        };
    }

    pub fn get_dirtree(repo: &Repository, sha1: &str) -> Result<Dirtree> {
        let oid = git2::Oid::from_str(sha1)?;
        let commit = repo.find_commit(oid)?;
        let tree = commit.tree()?;

        let mut dirtree = Dirtree::Dir("/".to_owned(), Vec::new());
        fill_directory(repo, &mut dirtree, &tree);

        Ok(dirtree)
    }
}
