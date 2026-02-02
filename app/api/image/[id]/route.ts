import { NextRequest, NextResponse } from "next/server";
import { drive } from "@/lib/google-drive";
import sharp from "sharp";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID de imagen requerido" },
        { status: 400 }
      );
    }

    // Obtener el tamaño del query param
    const searchParams = request.nextUrl.searchParams;
    const width = parseInt(searchParams.get("w") || "0");

    // Descargar el archivo de Google Drive
    const response = await drive.files.get(
      {
        fileId: id,
        alt: "media",
      },
      {
        responseType: "arraybuffer",
      }
    );

    const originalBuffer = Buffer.from(response.data as ArrayBuffer);

    // Redimensionar si se especifica un ancho
    let finalBuffer: Buffer;
    if (width > 0 && width <= 800) {
      finalBuffer = await sharp(originalBuffer)
        .resize(width, null, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    } else {
      finalBuffer = originalBuffer;
    }

    const headers = new Headers();
    headers.set("Content-Type", "image/jpeg");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new NextResponse(new Uint8Array(finalBuffer), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Error al cargar la imagen" },
      { status: 500 }
    );
  }
}
