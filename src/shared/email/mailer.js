import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';

const transport = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: { user: env.smtp.user, pass: env.smtp.pass },
});

if (env.nodeEnv !== 'production') {
  if (env.smtp.user && env.smtp.pass) {
    transport.verify()
      .then(() => console.log('\u2705 SMTP Brevo conectado correctamente'))
      .catch((err) => console.error('\u274c Error conectando a SMTP:', err));
  } else {
    console.log('⚠️ SMTP no configurado en .env (faltan credenciales). No se enviarán correos.');
  }
}

const from = `${env.smtp.fromName} <${env.smtp.fromAddress}>`;

export async function sendMail({ to, subject, html }) {
  return transport.sendMail({ from, to, subject, html });
}
