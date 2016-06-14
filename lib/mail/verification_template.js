'use strict';

export function getVerificationTemplate (route, token) {
  return `<!DOCTYPE html>
<html>
    <head>
        <title>Willkommen zu Webbox - Hochschule Coburg</title>
        <meta charset="utf-8" />
    </head>
    <body>
        <h1>Willkommen zur Webbox - Hochschule Coburg</h1>
        <p>
            Sie können Ihre Registrierung mit einem Klick auf diesen <a href="${route}/${token}">Link</a> abschließen.
        </p>
    </body>
</html>`;
}

export function getResendVerificationEmailBody(route, token) {
  return {
    body: {
      greeting: 'Hi',
      signature: '',
      name: '',
      intro: 'Du hast einen neuen Aktivierungslink für deine Registierung angefordert.',
      action: {
        instructions: 'Du kannst deine Registrierung mit einem Klick auf den Button abschließen.',
        button: {
          color: 'green',
          text: 'Registrierung abschließen',
          link: `${route}/${token}`
        }
      },
      outro: 'Falls es noch Fragen oder Probleme gibt, melde dich bei deinem Dozenten.'
    }
  };
}

export function getVerificationEmailBody(route, token) {
  return {
    body: {
      greeting: 'Hi',
      signature: '',
      name: '',
      intro: 'Willkommen zu trycoding.io - Hochschule Coburg',
      action: {
        instructions: 'Du kannst deine Registrierung mit einem Klick auf den Button abschließen.',
        button: {
          color: 'green',
          text: 'Registrierung abschließen',
          link: `${route}/${token}`
        }
      },
      outro: 'Falls es noch Fragen oder Probleme gibt, melde dich bei deinem Dozenten.'
    }
  };
}