import Config from '../../config/webbox.config';

const INTRO_BASE = [''];

export function getGeneralEmailBody(text='', name='') {
  let emailText = INTRO_BASE.concat(text);
  return {
    body: {
      //greeting: `Hi ${name}`,
      greeting: 'Hi',
      signature: 'Mit freundlichen Grüßen ',
      intro: emailText,
      outro: [
        'Bitte anworten Sie nicht auf diese E-Mail, sondern nutzen Sie die folgende Kontakt-Adresse.',
        `Falls es noch Fragen oder Probleme gibt, melden Sie sich bei ${Config.app.contact}.`
      ]
    }
  };
}