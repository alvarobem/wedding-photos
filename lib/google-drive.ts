import { google } from "googleapis";

// Configurar autenticación OAuth 2.0 con Refresh Token
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Establecer el refresh token del propietario
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// Cliente de Google Drive usando OAuth del propietario
export const drive = google.drive({ version: "v3", auth: oauth2Client });

// ID de la carpeta donde se guardarán las fotos
export const WEDDING_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

// Tipos
export interface UploadedPhoto {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
}

export interface PhotoListItem {
  id: string;
  name: string;
  uploadedBy: string;
  createdAt: string;
  thumbnail: string;
  fullSize: string;
}
