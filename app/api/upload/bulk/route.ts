import { NextRequest, NextResponse } from "next/server";
import { drive, WEDDING_FOLDER_ID } from "@/lib/google-drive";
import sharp from "sharp";
import { Readable } from "stream";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_REQUEST = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

interface UploadResult {
  originalName: string;
  success: boolean;
  id?: string;
  name?: string;
  url?: string;
  thumbnail?: string;
  error?: string;
}

async function processAndUploadImage(
  file: File,
  guestName: string
): Promise<UploadResult> {
  try {
    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        originalName: file.name,
        success: false,
        error: "Tipo de archivo no permitido",
      };
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return {
        originalName: file.name,
        success: false,
        error: "Archivo muy grande (máx 10MB)",
      };
    }

    // Procesar imagen con Sharp
    const buffer = Buffer.from(await file.arrayBuffer());
    const processedBuffer = await sharp(buffer)
      .rotate()
      .resize(2000, 2000, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    // Generar nombre de archivo
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const sanitizedName = guestName
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, "")
      .trim();
    const fileName = `${sanitizedName}_${timestamp}_${randomSuffix}.jpg`;

    // Subir a Google Drive
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [WEDDING_FOLDER_ID!],
        description: `Subida por: ${sanitizedName}`,
      },
      media: {
        mimeType: "image/jpeg",
        body: Readable.from(processedBuffer),
      },
      fields: "id, name",
    });

    // Hacer el archivo público
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    return {
      originalName: file.name,
      success: true,
      id: response.data.id!,
      name: response.data.name!,
      url: `/api/image/${response.data.id}`,
      thumbnail: `/api/image/${response.data.id}?w=400`,
    };
  } catch (error) {
    console.error(`Error uploading ${file.name}:`, error);
    return {
      originalName: file.name,
      success: false,
      error: "Error al procesar la imagen",
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!WEDDING_FOLDER_ID) {
      return NextResponse.json(
        { error: "Google Drive no está configurado" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const guestName = (formData.get("guestName") as string) || "Invitado";

    // Obtener todos los archivos
    const files: File[] = [];
    formData.forEach((value, key) => {
      if (key.startsWith("photo") && value instanceof File) {
        files.push(value);
      }
    });

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No se enviaron fotos" },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { error: `Máximo ${MAX_FILES_PER_REQUEST} fotos por solicitud` },
        { status: 400 }
      );
    }

    // Procesar todas las imágenes en paralelo
    const results = await Promise.all(
      files.map((file) => processAndUploadImage(file, guestName))
    );

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      total: files.length,
      uploaded: successCount,
      failed: failedCount,
      results,
    });
  } catch (error) {
    console.error("Error in bulk upload:", error);
    return NextResponse.json(
      { error: "Error al procesar las fotos" },
      { status: 500 }
    );
  }
}
