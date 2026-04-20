import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = new Resend(env.email.apiKey);

const sendPasswordResetEmail = async (email) => {
    const { data, error } = await resend.emails.send({
        from: 'PoliRank <onboarding@resend.dev>',
        to: [email],
        subject: 'Resetear tu contraseña de PoliPlanner',
        html: `
            <head>
                <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .button { 
                    display: inline-block; 
                    padding: 12px 24px; 
                    background-color: #007bff; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin: 20px 0;
                }
                </style>
            </head>
            <body>
                <div class="container">
                <h2>Recuperá tu contraseña</h2>
                <p>Hola,</p>
                <p>Recibimos una solicitud para resetear tu contraseña de PoliPlanner.</p>
                <p>Hacé click en el botón de abajo para crear una nueva contraseña:</p>
                <a href="" class="button">Resetear Contraseña</a>
                <p>O copiá y pegá este link en tu navegador:</p>
                <p style="color: #666; font-size: 14px;"></p>
                <p><strong>Este link expira en 1 hora.</strong></p>
                <p>Si no solicitaste este cambio, podés ignorar este email.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                <p style="color: #999; font-size: 12px;">
                    PoliPlanner
                </p>
                </div>
            </body>
        `,
    });

    if (error) {
        return console.error({ error });
    }

    console.log({ data });
}


export { sendPasswordResetEmail };

