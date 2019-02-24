import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button, FormGroup, InputGroup, Popover, Spinner, Toaster } from "@blueprintjs/core";
import { connect } from 'react-redux'
import { reposFetch, repoCreate, repoDelete } from './redux/actions'

const toaster = Toaster.create()

const DeleteButton = ({ handleClick, visible }) => (
  <Button intent='danger' text='' onClick={handleClick} icon='trash' minimal small disabled={!visible} />
)

const RepoItem = ({ name, handleDelete, deleteVisible, closePopup }) => (
  <>
    <DeleteButton className='delete-button' handleClick={() => handleDelete(name)} visible={deleteVisible} />
    <Link className='repo-name' onClick={closePopup} to={`/repo/${name}`}>{name}</Link>
  </>
)

const RepoList = ({ repositories, isLoaded, handleDelete, deleteVisible, closePopup }) => {
  if (isLoaded) {
    return (
      <div className="repo-list">
        {repositories.map((name, i) => <RepoItem name={name} key={i} handleDelete={handleDelete} deleteVisible={deleteVisible} closePopup={closePopup} />)}
      </div>
    )
  } else {
    return <Spinner intent='primary' />
  }
}

const NewRepoForm = ({ handleSubmit, handleChange, handleDelete, deleteVisible }) => (
  <div className="new-repo">
    <form onSubmit={handleSubmit}>
      <FormGroup
        helperText='Create a new repository'
        labelFor='name-input'
      >
        <InputGroup id='name-input' placeholder='Repository name' onChange={handleChange} />
        <Button type='submit' text='Create' intent='primary' />
      </FormGroup>
    </form>
    <Button text={deleteVisible ? 'Cancel' : 'Delete a repository'} intent='warning' onClick={handleDelete} />
  </div>
)

const RepoPopover = ({ repositories, isLoaded, reposFetch, repoCreate, repoDelete }) => {
  const [newRepoName, setNewRepoName] = useState("")
  const [deleteVisible, setDeleteVisible] = useState(false)
  const [popoverIsOpen, setPopoverIsOpen] = useState(false)
  const [firstLoad, setFirstLoad] = useState(true)

  useEffect(() => {
    if (firstLoad) {
      reposFetch()
      setFirstLoad(false)
    }
  }, [firstLoad])

  const contents = (
    <div className='popover'>
      <RepoList
        repositories={repositories}
        isLoaded={isLoaded}
        deleteVisible={deleteVisible}
        closePopup={() => setPopoverIsOpen(false)}
        handleDelete={name => {
          repoDelete(
            name,
            () => toaster.show({ message: 'Successfully deleted repository', intent: 'success' }),
            () => toaster.show({ message: 'Could not delete repository', intent: 'warning' }),
          )
          setDeleteVisible(false)
        }} />
      <NewRepoForm
        handleSubmit={e => {
          e.preventDefault()
          repoCreate(
            newRepoName,
            () => toaster.show({ message: 'Successfully created repository', intent: 'success' }),
            () => toaster.show({ message: 'Could not create repository', intent: 'warning' }),
          )
        }}
        handleChange={e => {
            const value = e.target.value
            setNewRepoName(value)
        }}
        handleDelete={() => setDeleteVisible(!deleteVisible)}
        deleteVisible={deleteVisible}
      />
    </div>
  )

  return (
    <Popover
      content={contents}
      target={<Button className='popover-button' text='Load repository' intent='primary' />}
      isOpen={popoverIsOpen}
      onInteraction={nextState => {
        if (nextState !== popoverIsOpen) {
          setPopoverIsOpen(nextState)
        }
      }} />
  )
}

const mapStateToProps = state => {
  return {
    repositories: state.repositories.repositories,
    isLoaded: !state.repositories.loading,
  }
}

const mapDispatchToProps = {
  reposFetch,
  repoCreate,
  repoDelete
}

export default connect(mapStateToProps, mapDispatchToProps)(RepoPopover)
