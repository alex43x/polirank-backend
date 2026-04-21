import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';

const transport = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: { user: env.smtp.user, pass: env.smtp.pass },
});

export async function sendMail({ to, subject, html }) {
  return transport.sendMail({ from: env.smtp.from, to, subject, html });
}
