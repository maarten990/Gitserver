'use strict';

const e = React.createElement;

class CreateRepository extends React.Component {
  constructor(props) {
    super(props);
    this.state = {name: "", msg: ""}

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({name: event.target.value});
  }

  handleSubmit(event) {
    const name = this.state.name;
    var formData = new FormData();
    formData.append("name", name);
    fetch("http://localhost:3000/create_repository", {
      method: "POST",
      body: formData
    })
      .then(response => response.json())
      .then(response => this.setState(
        {msg: response.data.success ? "Succesfully created repository." : "Could not create repository."})
      ),

      error => alert("Error!");

    // update the repo list
    this.props.onSubmit();
    event.preventDefault();
  }

  render() {
    const {name, msg} = this.state;
    return e("form", {onSubmit: this.handleSubmit},
             e("label", null, "Name: ",
               e("input", {type: "text", value: name, onChange: this.handleChange})),
             e("input", {type: "submit", value: "Create new"}),
             e("label", null, msg));
  }
}

class DeleteButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {msg: ""};
    this.deleteRepo = this.deleteRepo.bind(this);
  }

  deleteRepo() {
    var formData = new FormData();
    formData.append("name", this.props.name);

    fetch("http://localhost:3000/delete_repository", {
      method: "POST",
      body: formData
    })
      .then(response => response.json())
      .then(response => this.setState(
        {msg: response.data.success ? "Succesfully deleted repository." : "Could not delete repository."})
      ),

      error => alert("Error!");
    this.props.onClick();
  }

  render() {
    const msg = this.state.msg;
    return e("div", null,
             e("button", {onClick: this.deleteRepo}, "Delete"),
             e("div", null, msg));
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
    fetch("http://localhost:3000/get_repositories")
      .then(res => res.json())
      .then(result => {
        this.setState( {
          isLoaded: true,
          names: result.data
        });
      }),

      error => {
        this.setState({
          isLoaded: true,
          error
        });
      };
  }

  componentDidMount() {
    this.getFromRemote();
  }

  render() {
    const { isLoaded, error, names } = this.state;
    var list;
    if (error) {
      list = e("div", null, error.message);
    } else if (!isLoaded) {
      list = e("div", null, "Loading...");
    } else {
      list = e(
        "ul",
        null,
        names.map(name => e("li", {key: name}, name,
                            e(DeleteButton, {name: name, onClick: this.getFromRemote})))
      );
    }

    return e("div", null,
             list,
             e(CreateRepository, {onSubmit: this.getFromRemote}));
  }
}

const domContainer = document.querySelector('#repolist');
ReactDOM.render(e(RepoList), domContainer);
