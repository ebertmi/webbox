'use strict';

const NodeMailer = require('nodemailer');
const Config = require('../../config/webbox.config');
var SendGridTransport = require('nodemailer-sendgrid-transport');

const client = NodeMailer.createTransport(SendGridTransport({
  auth: {
    api_key: Config.mail.key
  }
}));



exports.sendHtmlEmail = (subject, mailContent, email) => {
  let mailOptions = {
    from: Config.mail.user,
    to: email,
    subject: subject,
    html: mailContent
  };

  client.sendMail(mailOptions, (err, res) => {
    if (err) {
      console.log(err);
    }

    console.log('Sent mail', res);
  });
};