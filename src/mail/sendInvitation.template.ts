export const sendInvitationTemplate = (teamName: string, userName: string, enlace: string) => {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invitación a ${teamName}</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #eef2f5;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .header {
        background-color: #2c3e50;
        color: #fff;
        padding: 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 22px;
        font-weight: 400;
      }
      .content {
        padding: 30px;
      }
      .content p {
        font-size: 16px;
        line-height: 1.6;
        margin-bottom: 20px;
      }
      .btn {
        display: inline-block;
        padding: 12px 24px;
        background-color: #2c3e50;
        color: #fff;
        text-decoration: none;
        border-radius: 4px;
        font-size: 16px;
        margin-top: 10px;
        transition: background-color 0.3s ease;
      }
      .btn:hover {
        background-color: #34495e;
      }
      .footer {
        background-color: #f9f9f9;
        border-top: 1px solid #ddd;
        padding: 15px;
        text-align: center;
        font-size: 12px;
        color: #777;
      }
      @media (max-width: 600px) {
        .container {
          margin: 20px;
        }
        .content {
          padding: 20px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Invitación a ${teamName}</h1>
      </div>
      <div class="content">
        <p>Hola ${userName},</p>
        <p>
          Te invitamos a unirte a nuestro equipo en <strong>${teamName}</strong>. Estamos emocionados de contar con tu talento y experiencia para llevar adelante este proyecto.
        </p>
        <p>
          Para confirmar tu incorporación, haz clic en el botón a continuación:
        </p>
        <p style="text-align: center;">
          <a href="${enlace}" class="btn">Confirmar Mi Unión</a>
        </p>
        <p>
          Si tienes alguna duda o comentario, no dudes en responder a este correo.
        </p>
      </div>
      <div class="footer">
        TaskMate © 2025. Todos los derechos reservados.
      </div>
    </div>
  </body>
</html>
`;
};
