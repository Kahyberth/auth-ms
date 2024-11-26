export const htmlTemplate = (otpCode: string) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código OTP</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333;
        }
        .container {
            width: 100%;
            padding: 20px;
            background-color: #ffffff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            margin: 40px auto;
            border-radius: 8px;
        }
        .header {
            background-color: #4CAF50;
            color: white;
            padding: 10px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 20px;
            text-align: center;
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #4CAF50;
            letter-spacing: 2px;
            margin: 20px 0;
        }
        .instructions {
            font-size: 16px;
            color: #666;
        }
        .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #999;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Tu código de verificación</h1>
        </div>
        <div class="content">
            <p>Hola,</p>
            <p>Utiliza el siguiente código para completar tu proceso de autenticación:</p>
            <div class="otp-code">${otpCode}</div>
            <p class="instructions">Este código es válido por 10 minutos. Si no solicitaste este código, por favor ignora este correo.</p>
        </div>
        <div class="footer">
            <p>Gracias por usar nuestro servicio.</p>
            <p>Equipo de Soporte</p>
        </div>
    </div>
</body>
</html>
`;
};
