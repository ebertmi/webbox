export function getForgotEmailBody(route, token) {
  return {
    body: {
      greeting: 'Hi',
      signature: 'Mit freundlichen Grüßen',
      name: '',
      intro: 'Wir haben eine Anfrage zum Zurücksetzen deines trycoding-Passworts erhalten.',
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
