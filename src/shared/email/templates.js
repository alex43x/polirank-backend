export function authLinkTemplate({ link, isNew }) {
  const action = isNew ? 'completar tu registro' : 'restablecer tu contraseña';
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2>PoliRank</h2>
      <p>Recibiste este correo para ${action}.</p>
      <p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">
          ${isNew ? 'Completar registro' : 'Restablecer contraseña'}
        </a>
      </p>
      <p style="color:#888;font-size:12px">Este enlace expira en 1 hora. Si no solicitaste esto, ignorá el mensaje.</p>
    </div>
  `;
}
