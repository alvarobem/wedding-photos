import { NextRequest, NextResponse } from "next/server";
import { drive, WEDDING_FOLDER_ID, PhotoListItem } from "@/lib/google-drive";

export async function GET(request: NextRequest) {
  try {
    // Verificar que las credenciales estén configuradas
    if (!WEDDING_FOLDER_ID) {
      return NextResponse.json(
        { error: "Google Drive no está configurado" },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const pageToken = searchParams.get("pageToken") || undefined;
    const pageSize = Math.min(
      parseInt(searchParams.get("pageSize") || "20"),
      50
    );

    // Listar archivos de la carpeta
    const response = await drive.files.list({
      q: `'${WEDDING_FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`,
      fields:
        "nextPageToken, files(id, name, description, createdTime, thumbnailLink)",
      pageSize,
      pageToken,
      orderBy: "createdTime desc",
    });

    const photos: PhotoListItem[] =
      response.data.files?.map((file) => ({
        id: file.id!,
        name: file.name!,
        uploadedBy:
          file.description?.replace("Subida por: ", "") || "Invitado",
        createdAt: file.createdTime!,
        thumbnail: `/api/image/${file.id}?w=400`,
        fullSize: `/api/image/${file.id}`,
      })) || [];

    return NextResponse.json({
      photos,
      nextPageToken: response.data.nextPageToken,
      hasMore: !!response.data.nextPageToken,
    });
  } catch (error) {
    console.error("Error listing photos:", error);
    return NextResponse.json(
      { error: "Error al cargar las fotos" },
      { status: 500 }
    );
  }
}
