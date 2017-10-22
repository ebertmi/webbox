export function getManualPasswordResetBody(route, newCleartextPassword) {
  return {
    body: {
      greeting: 'Hi',
      signature: 'Mit freundlichen Grüßen',
      name: '',
      intro: `der Administrator hat das Passwort für diesen Account manuell zurückgesetzt.\nDein neues Passwort lautet: ${newCleartextPassword}\nBitte ändere dein Password nach dem Einloggen.`,
      action: {
        instructions: 'Klicke auf diesen Link, um dich anzumelden',
        button: {
          color: 'green',
          text: 'Zur Seite',
          link: `${route}`
        }
      },
      outro: 'Falls du Fragen hast, kontaktiere bitte deinen Dozenten oder Adminstrator.'
    }
  };
}
