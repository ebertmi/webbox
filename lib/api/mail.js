import MailService from '../mail/mailservice';
import { getGeneralEmailBody } from '../mail/general_template';

export function* sendGeneralMail (request, reply) {
  const response = {};
  let email = request.payload.email;
  let message = request.payload.message;
  let subject = request.payload.subject;
  let template;

 // If any validation error has occured, reply with error
  if (request.pre.validation) {
    response.error = "Bitte füllen Sie all geforderten Eingabefelder aus.";
    return reply(response);
  }

  try {
    template = getGeneralEmailBody(message);
  } catch (e) {
    console.info(e);
    response.error = {
      message: 'E-Mail konnte nicht erzeugt werden.',
      type: 'Mail',
      error_user_title: 'Fehler',
      error_user_msg: 'Es ist leider ein unbekannter Fehler aufgetreten.'
    };

    yield reply(response);
  }

  try {
    MailService.sendHtmlEmail(subject, template, email);
  } catch (e) {
    console.info(e);
  }

  yield reply(response);
}