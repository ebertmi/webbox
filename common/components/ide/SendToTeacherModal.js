import React from 'react';
import PropTypes from 'prop-types';
//import Modal from '../Modal';
import Modal from 'react-modal';
import ModalBody from '../ModalBody';
import ModalFooter from '../ModalFooter';
import ModalHeader from '../ModalHeader';

/**
 * Toggable overlay for showing the send/share to/with teacher form.
 *
 * @export
 * @class SendToTeacherModal
 * @extends {React.Component}
 */
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
    return <Modal
      isOpen={this.props.isOpen}
      onRequestClose={this.props.toggle}
      shouldCloseOnOverlayClick={true}
      className={{
        base: 'modal-dialog',
        afterOpen: 'show',
        beforeClose: ''
      }}

      overlayClassName={{
        base: 'modal-backdrop',
        afterOpen: 'show',
        beforeClose: ''
      }}
    >
      <div className="modal-content">
        <ModalHeader toggle={this.props.toggle}>An Dozenten Schicken</ModalHeader>
        <ModalBody>
          <p>Sie können hier noch eine optinale Nachricht eingeben:</p>
          <textarea placeholder="Die Lösung verwendet..." className="form-control" rows="5" cols="" onChange={this.onMessageChange} value={this.state.message}></textarea>
          <small></small>
        </ModalBody>
        <ModalFooter>
          <button className="btn btn-primary" onClick={this.onSubmit}>Abschicken</button>{' '}
          <button className="btn btn-secondary" onClick={this.props.toggle}>Schließen</button>
        </ModalFooter>
      </div>
    </Modal>;
  }
}

SendToTeacherModal.propTypes = {
  toggle: PropTypes.func.isRequired,
  callback: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired
};