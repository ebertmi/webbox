import React, {Component} from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { Input } from '../bootstrap';
import TaggedInput from '../TaggedInput';
import { Link } from 'react-router';
import { Time } from '../Time';

const Fade = ({ children, ...props }) => (
  <CSSTransition
    {...props}
    timeout={{
      enter: 300,
      exit: 500,
     }}
    classNames="fade"
  >
    {children}
  </CSSTransition>
);

/**
 * The UserForm Component displays a user and allows to edit the user data.
 */
export class UserForm extends Component {
  constructor (props) {
    super(props);

    this.addRole = this.addRole.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleRoleChange = this.handleRoleChange.bind(this);
    this.handleResetUserPasswordManually = this.handleResetUserPasswordManually.bind(this);

    this.state = UserForm.getInitialState();
  }

  addRole(e) {
    e.preventDefault();
    const role = e.target.getAttribute('data-role');

    // User has already this role
    if (this.props.user.roles.includes(role)) {
      return;
    }

    this.handleRoleChange(role, this.props.user.roles.concat(role));
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

  handleUnblock (event) {
    event.preventDefault();
    this.props.unblockUser(this.props.user);
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

  handleResetUserPasswordManually (event) {
    event.preventDefault();
    this.props.resetUserPasswordManually(this.props.user);
  }

  handleConfirmUser (event) {
    event.preventDefault();

    this.props.confirmUser(this.props.user);
  }

  handleSendMail (event) {
    // ToDo: push state

    this.props.changeMailData({
      email: this.props.user.email,
      subject: '',
      message: ''
    });
  }

  /**
   * Renders the confirm dialog when a user should be deleted
   */
  renderConfirmDelete () {
    return (
        <TransitionGroup className='form-footer'>
          <Fade>
            <div className="form-inline">
              <p className="form-control-plaintext">Soll der Benutzer wirklich gelöscht werden?</p>
              <button onClick={this.handleDeleteConfirm.bind(this)} className="btn btn-danger btn-sm">Ja</button>
              <button onClick={this.handleDeleteDismiss.bind(this)} className="btn btn-secondary btn-sm">Nein</button>
            </div>
          </Fade>
      </TransitionGroup>
    );
  }

  /**
   * Renders the Save and Delete Buttons
   */
  renderFormButtons (isDirty) {
    return (
      <div className="form-footer">
        <button type="submit" onClick={this.handleSave.bind(this)} disabled={!isDirty} className="btn btn-success btn-sm">Speichern</button>
        <button type="submit" onClick={this.handleDelete.bind(this)} className="btn btn-danger btn-sm">Löschen</button>
        <button type="submit" onClick={this.handleResendConfirmationEmail.bind(this)} className="btn btn-warning btn-sm">Aktivierungs-E-Mail erneut schicken</button>
        <button type="submit" onClick={this.handleUnblock.bind(this)} className="btn btn-secondary btn-sm" title="Setzt die Anmeldesperre zurück, sodass sich der Benutzer wieder anmelden kann.">Anmeldung wieder erlauben</button>
        <button type="submit" onClick={this.handleResetUserPasswordManually} className="btn btn-secondary btn-sm" title="Setzt ein neues Passwort und schickt dieses in einer E-Mail dem Benutzer zu.">Neues Passwort zuschicken</button>
        <button type="submit" onClick={this.handleConfirmUser.bind(this)} className="btn btn-secondary btn-sm" title="Schaltet den Benutzer frei, ohne das dieser den Aktivierungslink anklicken muss.">Benutzer freischalten</button>
        <Link to="/admin/mail" onClick={this.handleSendMail.bind(this)} className="btn btn-info btn-sm" title="Neue E-Mail an den Benutzer schicken">Mail schicken</Link>
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
        <Input onChange={this.handleChange} name="email" type="text" label="E-Mail-Adresse" muted="Vorsicht: Benutzer werden anhand ihrer E-Mail-Adresse identifiziert. Diese muss eindeutig sein." value={this.props.user.email} />
        <Input onChange={this.handleChange} name="username" type="text" label="Benutzername" muted="Dieser wird aus der E-Mail-Adresse automatisch generiert." value={this.props.user.username} />
        <Input onChange={this.handleChange} name="isActive" type="checkbox" label="Aktiviert: Hiermit könnten Benutzer aktiviert und deaktiviert werden."  checked={this.props.user.isActive} />
        <Input onChange={this.handleChange} name="semester" type="text" label="Semester" muted="Semester in dem sich der Benutzer registriert hat." value={this.props.user.semester} />
        <Input onChange={this.handleChange} name="createdAt" type="text" label="Erstellt am" readOnly="readonly" value={this.props.user.createdAt} /> <span><Time value={this.props.user.createdAt} locale="de" relative={true} invalidDateString="kein Datum"/></span>
        <Input onChange={this.handleChange} name="verification.isCompleted" type="checkbox" label="Registrierung abgeschlossen" checked={this.props.user.verification.isCompleted} />
        <Input onChange={this.handleChange} name="verification.token" muted="Mit diesem Token kann der Benutzer den Account aktivieren." disabled type="text" label="Aktivierungs-Token" value={this.props.user.verification.token || ''} />
        <div className="form-group">
          <label>Rollen</label>
          <TaggedInput onAddTag={this.handleRoleChange} onRemoveTag={this.handleRoleChange} name="roles" placeholder="Benutzerrollen" tags={this.props.user.roles} />
          <small className="text-muted">Hier können die Benutzerrollen verändert werden. Diese entscheiden über die Zugriffsrechte auf der Seite.</small>
        </div>
        <div className="form-group">
          <button className="btn btn-info btn-sm" onClick={this.addRole} data-role="admin">Admin</button>
          <button className="btn btn-info btn-sm" onClick={this.addRole} data-role="author">Autor (Darf Beispiele und Dokumente anlegen)</button>
          <small className="text-muted">Klicken Sie auf einen der Buttons um dem Nutzer die Rolle zuzuweisen.</small>
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