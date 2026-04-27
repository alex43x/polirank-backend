export function authTemplate({ link, isNew }) {
  const title    = isNew ? '¡Bienvenido a PoliRank!' : 'Restablecé tu contraseña';
  const heading  = isNew ? 'Completá tu registro' : 'Restablecer contraseña';
  const btnLabel = isNew ? 'Completar registro' : 'Restablecer contraseña';

  const body = isNew
    ? `<p>Te informamos que <strong>tu acceso a PoliRank ya se encuentra habilitado</strong>.</p>
            <p>Para completar tu registro y establecer tu contraseña, hacé clic en el botón:</p>`
    : `<p>Recibiste este correo porque solicitaste <strong>restablecer tu contraseña</strong> en PoliRank.</p>
            <p>Hacé clic en el botón para continuar:</p>`;

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #36507D; color: white; padding: 20px; text-align: center; border-radius: 5px; }
          .content { padding: 20px; background-color: #f9f9f9; margin: 20px 0; border-left: 4px solid #36507D; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          strong { color: #36507D; }
          .btn { display: inline-block; background-color: #36507D; color: #ffffff !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            ${body}
            <center>
              <a href="${link}" class="btn">${btnLabel}</a>
            </center>
            <p style="color:#888;font-size:12px">Este enlace expira en 1 hora. Si no solicitaste esto, ignorá el mensaje.</p>
            <p>Saludos,<br><strong>Equipo de PoliRank</strong></p>
          </div>
          <div class="footer">
            <p>&copy; 2026 PoliRank. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

