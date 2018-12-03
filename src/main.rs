extern crate git2;
extern crate iron;
#[macro_use]
extern crate router;
extern crate mount;
extern crate staticfile;
extern crate url;

use git2::Repository;
use iron::modifiers::Redirect;
use iron::prelude::*;
use iron::status;
use mount::Mount;
use staticfile::Static;
use std::error;
use std::fmt;
use std::io;
use std::path::Path;
use url::Url;

type Result<T> = std::result::Result<T, GitError>;

#[derive(Debug)]
enum GitError {
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

/// Create a new repository in the current folder.
fn init_repo(name: &str, bare: bool) -> Result<Repository> {
    if Path::new(name).exists() {
        return Err(GitError::FS(io::Error::new(
            io::ErrorKind::AlreadyExists,
            "Repository already exists",
        )));
    }

    let repo = if bare {
        Repository::init_bare(name)
    } else {
        Repository::init(name)
    };

    repo.map_err(GitError::Git)
}

fn delete_repo(name: &str) -> Result<()> {
    std::fs::remove_dir_all(name).map_err(GitError::FS)
}

fn get_commits(repo: &Repository) -> Vec<String> {
    let walk = repo.revwalk().unwrap();
    let mut out: Vec<String> = Vec::new();

    for id in walk {
        let id = id.unwrap();
        let b = String::from_utf8(Vec::from(id.as_bytes())).unwrap();
        out.push(b);
    }

    out
}

fn testpage(_req: &mut Request) -> IronResult<Response> {
    Ok(Response::with((status::Ok, "Test page!")))
}

fn redirect_to_index(req: &mut Request) -> IronResult<Response> {
    let hostname: Url = req.url.clone().into();
    let target_url = hostname.join("/index.html").unwrap();
    let iron_url = iron::Url::from_generic_url(target_url).unwrap();
    Ok(Response::with((status::Found, Redirect(iron_url))))
}

fn main() {
    let _repo = match init_repo("test", false) {
        Ok(repo) => repo,
        Err(_) => Repository::open("test").unwrap(),
    };

    // The mounter for static files
    let mut mount = Mount::new();
    mount.mount("/", Static::new(Path::new("./html")));

    // The router for api requests
    let router = router!(
	root: get "/" => redirect_to_index,
        static_content: get "/*" => mount,
        test: get "/test" => testpage,
    );

    let _server = Iron::new(router).http("localhost:3000").unwrap();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    pub fn test_repo_creation() {
        // create repo
        let success = init_repo("foo_repo", false);
        assert!(success.is_ok(), success.err());

        // try to create a repo with the same name
        let success = init_repo("foo_repo", true);
        match success {
            Ok(_) => assert!(false, "Repo should already exist."),
            Err(GitError::Git(_)) => assert!(false, "Should be an FS error."),
            Err(GitError::FS(_)) => assert!(true),
        }

        // try to open the created repo
        let repo = Repository::open("foo_repo");
        assert!(repo.is_ok(), success.err());

        // try to open a non-existant repo
        let repo = Repository::open("quack quack");
        assert!(repo.is_err());

        // try to delete the repo
        let success = delete_repo("foo_repo");
        assert!(success.is_ok(), success.err());

        // try to delete the repo again
        let success = delete_repo("foo_repo");
        match success {
            Ok(_) => assert!(false, "Repo should not exist"),
            Err(GitError::Git(_)) => assert!(false, "Should be an FS error."),
            Err(GitError::FS(_)) => assert!(true),
        }
    }
}
