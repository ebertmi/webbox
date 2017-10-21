import React, {Component} from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { Input } from '../bootstrap';
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
 * The Courseform Component displays a course and allows to edit the course data.
 */
export class CourseForm extends Component {
  constructor (props) {
    super(props);

    this.state = CourseForm.getInitialState();
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

    // normal attributes
    update[event.target.name] = value;


    // trigger state update
    this.props.onChange(update);
  }

  /**
   * Saves the course.
   */
  handleSave (event) {
    event.preventDefault();
    // Validating
    let course = this.props.course;
    const requiredFields = ['slug', 'published', 'document', 'title'];
    let isValid = true;

    for (let rf of requiredFields) {
      if (course[rf] == null || course[rf] === '') {
        // Show message
        isValid = false;
        break;
      }
    }

    if (isValid) {
      this.setState({
        validationMessage: null
      });
      this.props.save(this.props.course);
    } else {
      this.setState({
        validationMessage: 'Bitte füllen Sie die Felder: Kurzlink, ID des Indexdokuments und Titel aus.'
      });
    }
  }

  handleDelete (event) {
    event.preventDefault();

    this.setState({
      showConfirmDelete: true
    });
  }

  handleDeleteConfirm (event) {
    event.preventDefault();

    this.props.delete(this.props.course);
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

  /**
   * Renders the confirm dialog when a course should be deleted
   */
  renderConfirmDelete () {
    return (
      <TransitionGroup className='form-footer'>
          <Fade>
            <div className="form-inline">
              <p className="form-control-plaintext">Soll der Kurs wirklich gelöscht werden?</p>
              <button onClick={this.handleDeleteConfirm.bind(this)} className="btn btn-danger">Ja</button>
              <button onClick={this.handleDeleteDismiss.bind(this)} className="btn btn-secondary">Nein</button>
            </div>
          </Fade>
      </TransitionGroup>
    );
  }

  /**
   * Renders the Save and Delete Buttons
   */
  renderFormButtons (isDirty) {
    let message = this.state.validationMessage != null ? <p className="text-muted">{this.state.validationMessage}</p> : null;

    return (
      <div className="form-footer">
        <button type="submit" onClick={this.handleSave.bind(this)} disabled={!isDirty} className="btn btn-success">Speichern</button>
        <button type="submit" onClick={this.handleDelete.bind(this)} className="btn btn-danger">Löschen</button>
        { message }
      </div>
    );
  }

  renderForm () {
    const isDirty = this.props.course.isDirty === true;
    const deleteContent = this.state.showConfirmDelete ? this.renderConfirmDelete() : null;
    const formButtons = this.state.showConfirmDelete ? null : this.renderFormButtons(isDirty);

    return (
      <form>
        <div className="form-group">
          <label>Interne ID</label>
          <p className="form-control-static"><strong>{this.props.course.id}</strong></p>
          <small className="text-muted">Eindeutige interne ID des Kurses. Diese wird für die interne Datenhaltung verwendet.</small>
        </div>
        <Input onChange={this.handleChange.bind(this)} name="title" required type="text" label="Titel" placeholder="Titel des Kurses" muted="Der Titel des Kurses wird auf der Hauptseite angezeigt." value={this.props.course.title} />
        <Input onChange={this.handleChange.bind(this)} name="published" required type="checkbox" label="Veröffentlicht" mutedParagraph="Ist der Kurs veröffentlicht, dann wird er auf der Hauptseite angezeigt." checked={this.props.course.published} />
        <Input onChange={this.handleChange.bind(this)} name="description" required type="text" label="Beschreibung" placeholder="Dieser Kurs..." muted="Hier können Sie den Kurs näher beschreiben." value={this.props.course.description} />
        <Input onChange={this.handleChange.bind(this)} name="slug" required type="text" label="Kurzlink" placeholder="Kurzlink" muted="Geben Sie einen Kurzlink an, unter diesem der Kurs erreicht werden kann." value={this.props.course.slug} />
        <Input onChange={this.handleChange.bind(this)} name="document" required type="text" label="ID des Indexdokuments" placeholder="" muted="Jeder Kurs hat ein Indexdokument (Notebook), welches alle weiteren Dokumente verlinkt. Dies ist der Einstieg und sollte alle Kursinformationen beinhalten." value={this.props.course.document} />
        <Input onChange={this.handleChange.bind(this)} name="logo" required type="text" label="Namen des Logos" placeholder="logo.png" muted="" value={this.props.course.logo}/>
        <div className="form-group">
          <label>Erstellt am </label>
          {' '}
          <Time value={this.props.course.createdAt} locale="de" relative={true} />
          {' und zuletzt aktualisiert '}
          <Time value={this.props.course.lastUpdate} locale="de" relative={true} />
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

CourseForm.getInitialState = function () {
  return {
    showConfirmDelete: false,
    validationMessage: null
  };
};