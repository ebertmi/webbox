import React from 'react';

import Modal from '../Modal';
import ModalBody from '../ModalBody';
import ModalFooter from '../ModalFooter';
import ModalHeader from '../ModalHeader';

export default class SendToTeacherModal extends React.Component {
  constructor(props) {
    super(props);

    this.onMessageChange = this.onMessageChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

    this.state = {
      message: ''
    };
  }

  onMessageChange(e) {
    const newMessage = e.target.value;
    this.setState({
      message: newMessage
    });

    e.preventDefault();
  }

  onSubmit(e) {
    e.preventDefault();

    // Now we have a message and the callback
    this.props.callback.call(null, this.state.message);

    // Hide overlay
    this.props.toggle();
  }

  render() {
    return <Modal isOpen={this.props.isOpen} toggle={this.props.toggle} backdrop={true}>
      <ModalHeader toggle={this.props.toggle}>An Dozenten Schicken</ModalHeader>
      <ModalBody>
        <p>Sie können hier noch eine optinale Nachricht eingeben:</p>
        <textarea className="form-control" rows="5" cols="" onChange={this.onMessageChange} value={this.state.message}></textarea>
        <small></small>
      </ModalBody>
      <ModalFooter>
        <button className="btn btn-primary" onClick={this.onSubmit}>Abschicken</button>{' '}
        <button className="btn btn-secondary" onClick={this.props.toggle}>Schließen</button>
      </ModalFooter>
    </Modal>;
  }
}

SendToTeacherModal.propTypes = {
  toggle: React.PropTypes.func.isRequired,
  callback: React.PropTypes.func.isRequired,
  isOpen: React.PropTypes.bool.isRequired
};