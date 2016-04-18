import React, {Component} from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Input } from '../bootstrap';
import TaggedInput from '../TaggedInput';

/**
 * The UserForm Component displays a user and allows to edit the user data.
 */
export class UserForm extends Component {
  constructor (props) {
    super(props);
  }

  componentWillMount () {
    this.setState(UserForm.getInitialState());
  }

  /**
   * Update changes to the user role. We need a custom handler for
   * the TaggedInput Component.
   */
  handleRoleChange (role, roles) {
    const update = {
      isDirty: true,
      roles: roles
    };

    // trigger state update
    this.props.onChange(update);
  }

  /**
   * Handles all input changes and triggers a redux state change using the onChange handler
   * from the parent.
   */
  handleChange (event) {
    let value;
    const update = {
      isDirty: true
    };

    switch (event.target.type) {
      case 'checkbox':
        value = event.target.checked;
        break;
      default:
        value = event.target.value;
    }

    // nested data structures are special cases
    if (event.target.name.startsWith('verification')) {
      const verificationValue = this.props.user.verification;
      switch(event.target.name) {
        case 'verification.isCompleted':
          verificationValue.isCompleted = value;
          break;
        case 'verification.token':
          verificationValue.token = value;
          break;
      }
      update.verification = verificationValue;
    } else {
      // normal attributes
      update[event.target.name] = value;
    }

    // trigger state update
    this.props.onChange(update);
  }

  /**
   * Saves the user.
   */
  handleSave (event) {
    event.preventDefault();

    this.props.save(this.props.user);
  }

  handleDelete (event) {
    event.preventDefault();

    this.setState({
      showConfirmDelete: true
    });
  }

  handleDeleteConfirm (event) {
    event.preventDefault();

    this.props.delete(this.props.user);
    this.setState({
      showConfirmDelete: false
    });
  }

  handleDeleteDismiss (event) {
    event.preventDefault();

    this.setState({
      showConfirmDelete: false
    });
  }

  handleResendConfirmationEmail (event) {
    event.preventDefault();

    this.props.resendConfirmationEmail(this.props.user);
  }

  /**
   * Renders the confirm dialog when a user should be deleted
   */
  renderConfirmDelete () {
    return (
      <div className="form-footer">
        <ReactCSSTransitionGroup transitionName="fade-in" transitionEnterTimeout={500} transitionLeaveTimeout={300}>
          <div className="form-inline">
            <p className="form-control-static">Soll der Benutzer wirklich gelöscht werden?</p>
            <button onClick={this.handleDeleteConfirm.bind(this)} className="btn btn-danger">Ja</button>
            <button onClick={this.handleDeleteDismiss.bind(this)} className="btn btn-default">Nein</button>
          </div>
        </ReactCSSTransitionGroup>
      </div>
    );
  }

  /**
   * Renders the Save and Delete Buttons
   */
  renderFormButtons (isDirty) {
    return (
      <div className="form-footer">
        <button type="submit" onClick={this.handleSave.bind(this)} disabled={!isDirty} className="btn btn-success">Speichern</button>
        <button type="submit" onClick={this.handleDelete.bind(this)} inputClassName="form-control" className="btn btn-danger">Löschen</button>
        <button type="submit" onClick={this.handleResendConfirmationEmail.bind(this)} inputClassName="form-control" className="btn btn-warning">Aktivierungs-E-Mail erneut schicken</button>
      </div>
    );
  }

  renderForm () {
    const isDirty = this.props.user.isDirty === true;
    const deleteContent = this.state.showConfirmDelete ? this.renderConfirmDelete() : null;
    const formButtons = this.state.showConfirmDelete ? null : this.renderFormButtons(isDirty);

    return (
      <form>
        <div className="form-group">
          <label>Interne ID</label>
          <p className="form-control-static"><strong>{this.props.user.id}</strong></p>
          <small className="text-muted">Eindeutige interne ID des Benutzers. Diese wird für die interne Datenhaltung verwendet.</small>
        </div>
        <Input onChange={this.handleChange.bind(this)} name="email" type="text" label="E-Mail-Adresse" muted="Vorsicht: Benutzer werden anhand ihrer E-Mail-Adresse identifiziert. Diese muss eindeutig sein." value={this.props.user.email} />
        <Input onChange={this.handleChange.bind(this)} name="username" type="text" label="Benutzername" muted="Dieser wird aus der E-Mail-Adresse automatisch generiert." value={this.props.user.username} />
        <Input onChange={this.handleChange.bind(this)} name="isActive" type="checkbox" label="Aktiviert: Hiermit könnten Benutzer aktiviert und deaktiviert werden."  checked={this.props.user.isActive} />
        <Input onChange={this.handleChange.bind(this)} name="semester" type="text" label="Semester" muted="Semester in dem sich der Benutzer registriert hat." value={this.props.user.semester} />
        <Input onChange={this.handleChange.bind(this)} name="createdAt" type="text" label="Erstellt am" readOnly="readonly" value={this.props.user.createdAt} />
        <Input onChange={this.handleChange.bind(this)} name="verification.isCompleted" type="checkbox" label="Registrierung abgeschlossen" checked={this.props.user.verification.isCompleted} />
        <Input onChange={this.handleChange.bind(this)} name="verification.token" muted="Mit diesem Token kann der Benutzer den Account aktivieren." disabled type="text" label="Aktivierungs-Token" value={this.props.user.verification.token || null} />
        <div className="form-group">
          <label>Rollen</label>
          <TaggedInput onAddTag={this.handleRoleChange.bind(this)} onRemoveTag={this.handleRoleChange.bind(this)} name="roles" placeholder="Benutzerrollen" tags={this.props.user.roles} />
          <small className="text-muted">Hier können die Benutzerrollen verändert werden. Diese entscheiden über die Zugriffsrechte auf der Seite.</small>
        </div>
        {formButtons}
        {deleteContent}
      </form>
    );
  }

  render () {
    const form = this.renderForm();

    return form;
  }
}

UserForm.getInitialState = function () {
  return {
    showConfirmDelete: false
  };
};