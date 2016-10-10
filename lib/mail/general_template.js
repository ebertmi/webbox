import Config from '../../config/webbox.config';

const INTRO_BASE = [''];

export function getGeneralEmailBody(text='', name='') {
  let emailText = INTRO_BASE.concat(text);
  if (name && name !== '' && !name.startsWith(' ')) {
    name = ' ' + name;
  }

  return {
    body: {
      greeting: `Hi${name}`,
      //greeting: 'Hi',
      signature: 'Mit freundlichen Grüßen ',
      intro: emailText,
      outro: [
        'Bitte anworten Sie nicht auf diese E-Mail, sondern nutzen Sie die folgende Kontakt-Adresse.',
        `${Config.app.contact}`
      ]
    }
  };
}