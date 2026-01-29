import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.BREVO_SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

console.log('Verifying SMTP transporter configuration...', {
  host: process.env.BREVO_SMTP_HOST,
  port: process.env.BREVO_SMTP_PORT,
  user: process.env.BREVO_SMTP_USER,
});

console.log("SMTP PASS existe?:", !!process.env.BREVO_SMTP_PASS);


transporter.verify()
  .then(() => console.log("✅ SMTP Brevo conectado correctamente"))
  .catch(err => console.error("❌ Error conectando a SMTP:", err));


/**
 * Carga los emails desde el archivo config/emails.json
 * @returns {array} - Array de emails
 */
const loadEmailsFromJSON = () => {
  try {
    const filePath = path.join(process.cwd(), '/email/emails.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    const config = JSON.parse(data);
    return config.welcomeEmails || [];
  } catch (error) {
    console.error('Error al cargar emails desde JSON:', error.message);
    return [];
  }
};

/**
 * Envía un correo de bienvenida con información de acceso a PoliRank
 * @param {string|array|null} recipients - Email, array de emails o null para cargar desde JSON
 * @returns {Promise} - Resultado del envío
 */

const emails = loadEmailsFromJSON();

if (emails.length === 0) {
  console.error('No hay emails configurados en el archivo JSON');
}

const sendWelcomeEmail = async (recipients = null) => {
  try {
    // Si no se proporcionan recipients, cargar desde el archivo JSON
    let emails;
    if (recipients === null) {
      emails = loadEmailsFromJSON();
      if (emails.length === 0) {
        return { success: false, error: 'No hay emails configurados en el archivo JSON' };
      }
    } else {
      // Normalizar recipients a un array
      emails = Array.isArray(recipients) ? recipients : [recipients];
    }

    const htmlContent = `
 <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #36507D; color: white; padding: 20px; text-align: center; border-radius: 5px; }
            .content { padding: 20px; background-color: #f9f9f9; margin: 20px 0; border-left: 4px solid #36507D; }
            .credentials { background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
            strong { color: #36507D; }
            .btn { display: inline-block; background-color: #36507D; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; color: inherit;}
            .btn:hover { background-color: #263A5C; }
            .a { color: white; ; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Bienvenido a PoliRank!</h1>
            </div>
            
            <div class="content">
              <p>Hola,</p>
              
              <p>Te informamos que <strong>tu acceso a PoliRank ya se encuentra habilitado</strong>.</p>
              
              <p>Si es tu primera vez ingresando, utiliza los siguientes datos:</p>
              
              <div class="credentials">
                <p><strong>Correo:</strong> Tu correo institucional</p>
                <p><strong>Contraseña:</strong> Tu correo institucional hasta antes del "@"</p>
              </div>
              
              <p>Una vez dentro, podrás cambiar tu contraseña cuando lo desees.</p>
              
              <center>
                <a href="${process.env.APP_URL || 'https://www.polirank.org'}" class="btn">Ingresar a PoliRank</a>
              </center>
              
              <p>Si tienes algún inconveniente para ingresar o detectas algún error, por favor responde este correo y nos encargaremos de revisarlo.</p>
              
              <p>Saludos,<br>
              <strong>Equipo de PoliRank</strong></p>
            </div>
            
            <div class="footer">
              <p>&copy; 2026 PoliRank. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
      to: emails.join(', '),
      subject: '¡Bienvenido a PoliRank! Tu acceso ha sido habilitado',
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Correo enviado exitosamente a: ${emails.join(', ')}`);
    console.log(`ID de respuesta: ${info.response}`);
    return { success: true, info };
  } catch (error) {
    console.error('Error al enviar correo:', error);
    return { success: false, error: error.message };
  }
};

sendWelcomeEmail().then(result => {
  if (result.success) {
    console.log('Correos de bienvenida enviados correctamente.');
  } else {
    console.error('Error al enviar correos de bienvenida:', result.error);
  }
});