import Mailgen from 'mailgen';
/*
module.exports = {
  getForgotPasswordTemplate: function (route, token) {
    return `<!DOCTYPE html>
<html>
    <head>
        <title>Passwort zurücksetzen - Webbox</title>
        <meta charset="utf-8" />
    </head>
    <body>
        <h1>Passwort zurücksetzen - Webbox</h1>
        <p>
            Sie können Ihr Passwort mit einem Klick auf diesen <a href="${route}/${token}">Link</a> zurücksetzen.
        </p>
        <p>
          Sollten Sie diese E-Mail nicht angefordert haben, ignorieren Sie diese bitte.
    </body>
</html>`;
  }


};
*/
export function getForgotEmailBody(route, token) {
  return {
    body: {
      greeting: 'Hi',
      signature: '',
      name: '',
      intro: 'Wir haben eine Anfrage zum Zurücksetzen deines trycoding.io-Passworts erhalten.',
      action: {
        instructions: 'Klicke auf den Button unten und befolge die weiteren Instruktionen.',
        button: {
          color: 'red',
          text: 'Passwort zurücksetzen',
          link: `${route}/${token}`
        }
      },
      outro: 'Wenn du diese Nachricht ignorierst, wird dein Passwort nicht geändert. Wenn du das Zurücksetzen deines Passworts nicht beantragt hast, teile es uns mit.'
    }
  };
}
