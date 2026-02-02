/**
 * Script para obtener el Refresh Token de Google OAuth 2.0
 *
 * Uso:
 * 1. Primero configura GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env.local
 * 2. Ejecuta: npm run get-token
 * 3. Se abrirá el navegador para autorizar
 * 4. Copia el REFRESH_TOKEN que aparece en la consola
 * 5. Añádelo a .env.local como GOOGLE_REFRESH_TOKEN
 */

const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const { exec } = require('child_process');
const destroyer = require('server-destroy');
require('dotenv').config({ path: '.env.local' });

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3001/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\n❌ Error: Falta GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en .env.local\n');
  console.log('Pasos a seguir:');
  console.log('1. Ve a https://console.cloud.google.com/');
  console.log('2. Crea credenciales OAuth 2.0 (ver instrucciones en el plan)');
  console.log('3. Añade a .env.local:');
  console.log('   GOOGLE_CLIENT_ID=tu_client_id');
  console.log('   GOOGLE_CLIENT_SECRET=tu_client_secret\n');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Generar URL de autorización
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/drive.file'],
  prompt: 'consent', // Forzar que muestre el consentimiento para obtener refresh_token
});

console.log('\n🔐 Autorización de Google Drive\n');

// Función para abrir URL en el navegador (compatible con macOS, Linux, Windows)
function openBrowser(url) {
  const platform = process.platform;
  let command;

  if (platform === 'darwin') {
    command = `open "${url}"`;
  } else if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }

  exec(command, (error) => {
    if (error) {
      console.log('No se pudo abrir el navegador automáticamente.');
      console.log('Por favor, abre esta URL manualmente:\n');
      console.log(authUrl);
      console.log('\n');
    }
  });
}

// Crear servidor temporal para recibir el callback
const server = http.createServer(async (req, res) => {
  try {
    const queryParams = url.parse(req.url, true).query;

    if (queryParams.code) {
      // Obtener tokens con el código de autorización
      const { tokens } = await oauth2Client.getToken(queryParams.code);

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <html>
          <head><title>Autorización completada</title></head>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1 style="color: #22c55e;">✅ ¡Autorización completada!</h1>
            <p>Ya puedes cerrar esta ventana y volver a la terminal.</p>
          </body>
        </html>
      `);

      console.log('✅ ¡Autorización exitosa!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n📋 Añade esta línea a tu archivo .env.local:\n');
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      server.destroy();
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <html>
        <body style="font-family: system-ui; padding: 40px; text-align: center;">
          <h1 style="color: #ef4444;">❌ Error</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `);
    server.destroy();
  }
});

destroyer(server);

server.listen(3001, () => {
  console.log('Abriendo el navegador para autorizar...\n');
  openBrowser(authUrl);
});
