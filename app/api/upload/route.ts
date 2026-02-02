import { NextRequest, NextResponse } from "next/server";
import { drive, WEDDING_FOLDER_ID, UploadedPhoto } from "@/lib/google-drive";
import sharp from "sharp";
import { Readable } from "stream";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export async function POST(request: NextRequest) {
  try {
    // Verificar que las credenciales estén configuradas
    if (!WEDDING_FOLDER_ID) {
      return NextResponse.json(
        { error: "Google Drive no está configurado" },
        { status: 500 }
      );
    }

    // Parsear FormData
    const formData = await request.formData();
    const file = formData.get("photo") as File | null;
    const guestName = (formData.get("guestName") as string) || "Invitado";

    if (!file) {
      return NextResponse.json(
        { error: "No se envió ninguna foto" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Usa JPG, PNG o WebP" },
        { status: 400 }
      );
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El archivo es muy grande. Máximo 10MB" },
        { status: 400 }
      );
    }

    // Procesar imagen con Sharp
    const buffer = Buffer.from(await file.arrayBuffer());
    const processedBuffer = await sharp(buffer)
      .rotate() // Auto-rotar basado en EXIF
      .resize(2000, 2000, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    // Generar nombre de archivo
    const timestamp = Date.now();
    const sanitizedName = guestName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, "").trim();
    const fileName = `${sanitizedName}_${timestamp}.jpg`;

    // Subir a Google Drive
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [WEDDING_FOLDER_ID],
        description: `Subida por: ${sanitizedName}`,
      },
      media: {
        mimeType: "image/jpeg",
        body: Readable.from(processedBuffer),
      },
      fields: "id, name",
    });

    // Hacer el archivo público para lectura
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    const photo: UploadedPhoto = {
      id: response.data.id!,
      name: response.data.name!,
      url: `/api/image/${response.data.id}`,
      thumbnail: `/api/image/${response.data.id}?w=400`,
    };

    return NextResponse.json({
      success: true,
      photo,
    });
  } catch (error) {
    console.error("Error uploading photo:", error);
    return NextResponse.json(
      { error: "Error al subir la foto. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
