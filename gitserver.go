package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"strings"

	"github.com/valyala/fasthttp"
	"gopkg.in/src-d/go-git.v4"
	"gopkg.in/src-d/go-git.v4/plumbing"
	"gopkg.in/src-d/go-git.v4/plumbing/filemode"
	"gopkg.in/src-d/go-git.v4/plumbing/object"
)

type Commit struct {
	Message string `json:"message"`
	Sha1    string `json:"sha1"`
}

type DirtreeNode struct {
	Name     string        `json:"name"`
	Children []DirtreeNode `json:"children,omitempty"`
}

func (node *DirtreeNode) AddFromStrings(names []string) {
	if len(names) > 0 {
		name := names[0]
		for _, child := range node.Children {
			if name == child.Name {
				child.AddFromStrings(names[1:])
				return
			}
		}
		newNode := DirtreeNode{name, []DirtreeNode{}}
		newNode.AddFromStrings(names[1:])
		node.Children = append(node.Children, newNode)
	}
}

func getRepositories() ([]string, error) {
	files, err := ioutil.ReadDir("./repositories")
	var repos []string
	if err != nil {
		return repos, err
	}

	for _, file := range files {
		repos = append(repos, file.Name())
	}

	return repos, nil
}

func getCommits(name []byte) ([]Commit, error) {
	repo, err := git.PlainOpen(fmt.Sprintf("./repositories/%s", name))
	var commits []Commit
	if err != nil {
		return commits, err
	}

	head, err := repo.Head()
	if err != nil {
		return commits, err
	}

	log, err := repo.Log(&git.LogOptions{From: head.Hash()})
	if err != nil {
		return commits, err
	}

	_ = log.ForEach(func(commit *object.Commit) error {
		commits = append(commits, Commit{commit.Message, commit.Hash.String()})
		return nil
	})

	return commits, nil
}

func getDiffs(name []byte, sha1 [20]byte) ([]string, error) {
	repo, err := git.PlainOpen(fmt.Sprintf("./repositories/%s", name))
	diffs := []string{}
	if err != nil {
		return diffs, err
	}

	commit, err := repo.CommitObject(sha1)
	if err != nil {
		return diffs, err
	}

	parent, err := commit.Parent(0)
	if err != nil {
		return diffs, err
	}

	patch, err := parent.Patch(commit)
	if err != nil {
		return diffs, err
	}

	return []string{patch.String()}, nil
}

func getDirtree(name []byte, sha1 [20]byte) (DirtreeNode, error) {
	repo, err := git.PlainOpen(fmt.Sprintf("./repositories/%s", name))
	root := DirtreeNode{"/", []DirtreeNode{}}
	if err != nil {
		return root, err
	}

	commit, err := repo.CommitObject(sha1)
	if err != nil {
		return root, err
	}

	tree, err := object.GetTree(repo.Storer, commit.TreeHash)
	if err != nil {
		return root, err
	}

	seen := make(map[plumbing.Hash]bool)
	walker := object.NewTreeWalker(tree, true, seen)
	for {
		name, entry, err := walker.Next()
		if err != nil {
			if err == io.EOF {
				break
			} else {
				continue
			}
		}

		if entry.Mode == filemode.Dir {
			continue
		}

		root.AddFromStrings(strings.Split(name, "/"))
	}

	return root, nil
}

func getFileContents(name []byte, sha1 [20]byte, path string) (string, error) {
	repo, err := git.PlainOpen(fmt.Sprintf("./repositories/%s", name))
	out := ""
	if err != nil {
		return out, err
	}

	commit, err := repo.CommitObject(sha1)
	if err != nil {
		return out, err
	}

	tree, err := object.GetTree(repo.Storer, commit.TreeHash)
	if err != nil {
		return out, err
	}

	file, err := tree.File(path)
	if err != nil {
		return out, err
	}

	return file.Contents()
}

func createRepo(name []byte) (map[string]bool, error) {
	out := make(map[string]bool)
	var outErr error

	if len(name) == 0 {
		outErr = errors.New("Missing `name` parameter.")
	} else {
		path := fmt.Sprintf("./repositories/%s", name)
		_, err := git.PlainInit(path, true)

		out["success"] = err == nil
	}

	return out, outErr
}

func deleteRepo(name []byte) (map[string]bool, error) {
	out := make(map[string]bool)
	var outErr error

	if len(name) == 0 {
		outErr = errors.New("Missing `name` parameter.")
	} else {
		path := fmt.Sprintf("./repositories/%s", name)
		_, err := os.Stat(path)
		if os.IsNotExist(err) {
			out["success"] = false
		} else {
			outErr = os.RemoveAll(fmt.Sprintf("./repositories/%s", name))
			out["success"] = outErr == nil
		}
	}

	return out, outErr
}

func returnJson(ctx *fasthttp.RequestCtx, encoder *json.Encoder, payload interface{}) error {
	ctx.Response.Header.SetCanonical([]byte("Content-Type"), []byte("application/json"))
	formattedPayload := map[string]interface{}{"data": payload}
	return encoder.Encode(formattedPayload)
}

func handleGet(ctx *fasthttp.RequestCtx, fsHandler fasthttp.RequestHandler) (interface{}, error) {
	var payload interface{} = nil
	var err error = nil

	switch string(ctx.Path()) {
	case "/api/get_repositories":
		payload, err = getRepositories()
	case "/api/get_commits":
		name := ctx.QueryArgs().Peek("name")
		payload, err = getCommits(name)
	case "/api/get_diffs":
		name := ctx.QueryArgs().Peek("name")
		sha1 := ctx.QueryArgs().Peek("sha1")
		payload, err = getDiffs(name, plumbing.NewHash(string(sha1)))
	case "/api/get_dirtree":
		name := ctx.QueryArgs().Peek("name")
		sha1 := ctx.QueryArgs().Peek("sha1")
		payload, err = getDirtree(name, plumbing.NewHash(string(sha1)))
	case "/api/get_filecontents":
		name := ctx.QueryArgs().Peek("name")
		sha1 := ctx.QueryArgs().Peek("sha1")
		path := ctx.QueryArgs().Peek("path")
		payload, err = getFileContents(name, plumbing.NewHash(string(sha1)), string(path))
	default:
		fsHandler(ctx)
	}

	return payload, err
}

func handlePost(ctx *fasthttp.RequestCtx) (interface{}, error) {
	var payload interface{} = nil
	var err error = nil

	switch string(ctx.Path()) {
	case "/api/create_repository":
		name := ctx.FormValue("name")
		payload, err = createRepo(name)
	case "/api/delete_repository":
		name := ctx.FormValue("name")
		payload, err = deleteRepo(name)
	}

	return payload, err
}

func createHandler(fsHandler fasthttp.RequestHandler) func(*fasthttp.RequestCtx) {
	return func(ctx *fasthttp.RequestCtx) {
		var payload interface{} = nil
		var err error = nil
		if ctx.Request.Header.IsGet() {
			payload, err = handleGet(ctx, fsHandler)
		} else if ctx.Request.Header.IsPost() {
			payload, err = handlePost(ctx)
		}

		jsonEncoder := json.NewEncoder(ctx)
		if err != nil {
			ctx.SetStatusCode(fasthttp.StatusInternalServerError)
			fmt.Fprint(ctx, err.Error())
		} else if payload != nil {
			jsonErr := returnJson(ctx, jsonEncoder, payload)
			if jsonErr != nil {
				ctx.SetStatusCode(fasthttp.StatusInternalServerError)
				fmt.Fprint(ctx, jsonErr.Error())
			}
		}
	}
}

func pathRewrite(ctx *fasthttp.RequestCtx) []byte {
	path := bytes.Split(ctx.Path(), []byte("/"))
	if len(path) > 0 && bytes.Equal(path[0], []byte("/")) {
		return []byte("/index.html")
	} else if len(path) > 1 && bytes.Equal(path[1], []byte("repo")) {
		return []byte("/index.html")
	} else {
		return ctx.Path()
	}
}

func main() {
	fs := &fasthttp.FS{
		Root:               "./html-client/build",
		IndexNames:         []string{"index.html"},
		GenerateIndexPages: false,
		PathRewrite:        pathRewrite,
	}
	fsHandler := fs.NewRequestHandler()
	err := fasthttp.ListenAndServe("0.0.0.0:3001", createHandler(fsHandler))
	if err != nil {
		fmt.Printf("Could not start server: %s\n", err)
	}
}
