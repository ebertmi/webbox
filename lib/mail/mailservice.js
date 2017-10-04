import Mailgen from 'mailgen';
import NodeMailer from 'nodemailer';
import Config from '../../config/webbox.config';
import SendGridTransport from 'nodemailer-sendgrid-transport';

const mailGenerator = new Mailgen({
  theme: 'salted',
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
      console.log("Failed to sent e-mail", err);
    } else {
      console.log('Sent mail', subject, res);
    }
  });
};