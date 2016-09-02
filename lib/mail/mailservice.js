import Mailgen from 'mailgen';
import NodeMailer from 'nodemailer';
import Config from '../../config/webbox.config';
import SendGridTransport from 'nodemailer-sendgrid-transport';
import path from 'path';

/**
 * Base mail template path. This is relative to the working directory of the trycoding.io
 */
const BASE_PATH = './lib/mail/theme';

const mailGenerator = new Mailgen({
  theme: {
    // Build an absolute path to the theme file within your project
    path: path.resolve(BASE_PATH, 'index.html'),
    // Also (optionally) provide the path to a plaintext version of the theme (if you wish to use `generatePlaintext()`)
    plaintextPath: path.resolve(BASE_PATH, 'index.txt')
  },
  product: {
    name: 'trycoding.io - Hochschule Coburg',
    link: 'www.trycoding.io',
    copyright: 'trycoding.io - Hochschule Coburg'
  }
});

const client = NodeMailer.createTransport(SendGridTransport({
  auth: {
    api_key: Config.mail.key
  }
}));


exports.sendHtmlEmail = (subject, template, email) => {
  let mailOptions = {
    from: Config.mail.user,
    to: email,
    subject: subject,
    html: mailGenerator.generate(template)
  };

  client.sendMail(mailOptions, (err, res) => {
    if (err) {
      console.log(err);
    }

    console.log('Sent mail', res);
  });
};