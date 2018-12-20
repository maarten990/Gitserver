import React  from 'react';
import './App.css';
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

const API_URL = "/api/";

class CreateRepository extends React.Component {
  constructor(props) {
    super(props);
    this.state = { name: "", msg: "" }

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ name: event.target.value });
  }

  handleSubmit(event) {
    const name = this.state.name;
    var formData = new FormData();
    formData.append("name", name);
    fetch(API_URL + "create_repository", {
      method: "POST",
      body: formData
    })
      .then(response => response.json())
      .then(response => {
        this.setState(
          { msg: response.data.success ? "Succesfully created repository." : "Could not create repository." });
        this.props.onSubmit();
      })
      .catch(() => this.setState({msg: "Could not contact server"}));

    event.preventDefault();
  }

  render() {
    const { name, msg } = this.state;
    return (
      <form onSubmit={this.handleSubmit}>
        <label>Name: </label>
        <input type="text" value={name} onChange={this.handleChange}/>
        <input type="submit" value="Create new"/>
        <label>{msg}</label>
      </form>
    );
  }
}

class DeleteButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = { msg: "" };
    this.deleteRepo = this.deleteRepo.bind(this);
  }

  deleteRepo() {
    var formData = new FormData();
    formData.append("name", this.props.name);

    fetch(API_URL + "delete_repository", {
      method: "POST",
      body: formData
    })
      .then(response => response.json())
      .then(response => {
        this.setState(
          { msg: response.data.success ? "Succesfully deleted repository." : "Could not delete repository." }
        );
        this.props.onClick();
      })
      .catch(() => this.setState({msg: "Could not contact server"}));
  }

  render() {
    const msg = this.state.msg;
    return (
      <div>
        <button onClick={this.deleteRepo}>Delete</button>
        <div>{msg}</div>
      </div>
    );
  }
}

class RepoList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoaded: false,
      error: null,
      names: []
    };

    this.getFromRemote = this.getFromRemote.bind(this);
  }

  getFromRemote() {
    fetch(API_URL + "get_repositories")
      .then(result => result.json())
      .then(result => {
        this.setState({
          isLoaded: true,
          names: result.data
        });
      })
      .catch(() =>
        this.setState({
          isLoaded: true,
          error: "Could not get repositories from server."
        }));
  }

  componentDidMount() {
    this.getFromRemote();
  }

  render() {
    const { isLoaded, error, names } = this.state;
    var list;
    if (error) {
      list = <div>{error}</div>;
    } else if (!isLoaded) {
      list = <div>Loading...</div>;
    } else {
      const names_list = names.map(
        (name) => {
          return (
            <li>
              <Link to={"/repo/" + name}>{name}</Link>
              <DeleteButton name={name} onClick={this.getFromRemote} />
            </li>
          );
        });
      list = <ul>{names_list}</ul>;
    }

    return (
      <div>
        {list}
        <CreateRepository onSubmit={this.getFromRemote} />
      </div>
    );
  }
}

class CommitList extends React.Component {
  constructor(props) {
    super(props);
    const name = props.match.params.name;
    this.state = {
      isLoaded: false,
      error: null,
      messages: [],
      repo_name: name
    };

    this.getFromRemote = this.getFromRemote.bind(this);
  }

  getFromRemote() {
    fetch(API_URL + "get_repository")
      .then(result => result.json())
      .then(result => {
        this.setState({
          isLoaded: true,
          messages: result.data
        });
      })
      .catch(() =>
        this.setState({
          isLoaded: true,
          error: "Could not get repository from server."
        }));
  }

  componentDidMount() {
    // this.getFromRemote();
  }

  render() {
    const { isLoaded, error, messages, repo_name } = this.state;
    var list;
    if (error) {
      list = <div>{error.message}</div>;
    } else if (!isLoaded) {
      list = <div>Loading commits for {repo_name} </div>;
    } else {
      list = <div>Placeholder for {repo_name}...</div>;
    }

    return <div>{list}</div>;
  }
}

const AppRouter = () => (
  <Router>
    <div>
      <h2>Bleep Bloop</h2>
      <Route exact path="/" component={RepoList} />
      <Route path="/repo/:name" component={CommitList} />
    </div>
  </Router>
);

export default AppRouter;
