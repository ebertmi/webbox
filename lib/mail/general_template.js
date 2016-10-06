import Config from '../../config/webbox.config';

const INTRO_BASE = ['trycoding.io - Hochschule Coburg', ''];

export function getGeneralEmailBody(text='', name='') {
  let emailText = INTRO_BASE.concat(text);
  return {
    body: {
      //greeting: `Hi ${name}`,
      greeting: ' ',
      signature: 'Mit freundlichen Grüßen ',
      intro: emailText,
      outro: [
        `Falls es noch Fragen oder Probleme gibt, melden Sie sich bei ${Config.app.contact}.`,
        'Bitte anworten Sie nicht auf diese E-Mail, sondern nutzen Sie die angegebene Kontakt-Adresse.']
    }
  };
}