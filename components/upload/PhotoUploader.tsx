"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Check, Loader2, CloudUpload } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface FileWithPreview extends File {
  preview: string;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
}

export function PhotoUploader() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [guestName, setGuestName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        status: "pending" as const,
        progress: 0,
      })
    );
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".heic"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    const pendingToUpload = files.filter((f) => f.status !== "success");
    const BATCH_SIZE = 10;

    // Dividir en lotes de máximo 10 archivos
    for (let i = 0; i < pendingToUpload.length; i += BATCH_SIZE) {
      const batch = pendingToUpload.slice(i, i + BATCH_SIZE);

      // Marcar todos los del lote como uploading
      setFiles((prev) =>
        prev.map((f) =>
          batch.some((b) => b.id === f.id)
            ? { ...f, status: "uploading" as const }
            : f
        )
      );

      try {
        const formData = new FormData();
        formData.append("guestName", guestName || "Invitado");

        // Añadir todos los archivos del lote
        batch.forEach((file, index) => {
          formData.append(`photo${index}`, file);
        });

        const response = await fetch("/api/upload/bulk", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Error al subir");
        }

        const data = await response.json();

        // Actualizar estado según resultados
        setFiles((prev) =>
          prev.map((f) => {
            const batchFile = batch.find((b) => b.id === f.id);
            if (!batchFile) return f;

            const result = data.results?.find(
              (r: { originalName: string }) => r.originalName === batchFile.name
            );

            if (result?.success) {
              return { ...f, status: "success" as const, progress: 100 };
            } else {
              return { ...f, status: "error" as const };
            }
          })
        );
      } catch {
        // Marcar todos los del lote como error
        setFiles((prev) =>
          prev.map((f) =>
            batch.some((b) => b.id === f.id)
              ? { ...f, status: "error" as const }
              : f
          )
        );
      }
    }

    setIsUploading(false);
  };

  const pendingFiles = files.filter((f) => f.status !== "success");
  const successCount = files.filter((f) => f.status === "success").length;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Campo de nombre */}
      <div className="mb-6">
        <label className="block font-[family-name:var(--font-montserrat)] text-sm text-warm-gray mb-2">
          Tu nombre (opcional)
        </label>
        <input
          type="text"
          placeholder="Escribe tu nombre..."
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-sand rounded-xl font-[family-name:var(--font-montserrat)] text-charcoal placeholder:text-taupe focus:outline-none focus:border-gold-accent transition-colors"
        />
      </div>

      {/* Zona de drop */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300",
          isDragActive
            ? "border-gold-accent bg-gold-accent/5 scale-[1.02]"
            : "border-sand bg-white hover:border-taupe",
          isUploading && "opacity-50 pointer-events-none"
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center">
          <motion.div
            animate={isDragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
            className="w-16 h-16 rounded-full bg-beige flex items-center justify-center mb-4"
          >
            <CloudUpload
              className={cn(
                "w-8 h-8 transition-colors",
                isDragActive ? "text-gold-accent" : "text-warm-gray"
              )}
            />
          </motion.div>

          {isDragActive ? (
            <p className="font-[family-name:var(--font-cormorant)] text-xl text-gold-accent">
              Suelta las fotos aquí...
            </p>
          ) : (
            <>
              <p className="font-[family-name:var(--font-cormorant)] text-xl text-charcoal mb-2">
                Arrastra tus fotos aquí
              </p>
              <p className="font-[family-name:var(--font-montserrat)] text-sm text-warm-gray mb-4">
                o haz clic para seleccionar
              </p>
              <p className="font-[family-name:var(--font-montserrat)] text-xs text-taupe">
                JPG, PNG, WebP, HEIC • Máximo 10MB por foto
              </p>
            </>
          )}
        </div>
      </div>

      {/* Preview de archivos */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-[family-name:var(--font-montserrat)] text-sm text-warm-gray">
                {files.length} foto{files.length !== 1 && "s"} seleccionada
                {files.length !== 1 && "s"}
                {successCount > 0 && ` (${successCount} subida${successCount !== 1 ? "s" : ""})`}
              </p>
              {pendingFiles.length > 0 && (
                <button
                  onClick={() => setFiles([])}
                  className="font-[family-name:var(--font-montserrat)] text-xs text-warm-gray hover:text-charcoal transition-colors"
                >
                  Limpiar todo
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative aspect-square rounded-lg overflow-hidden group"
                >
                  <Image
                    src={file.preview}
                    alt={file.name}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />

                  {/* Overlay de estado */}
                  <div
                    className={cn(
                      "absolute inset-0 flex items-center justify-center transition-all",
                      file.status === "uploading" && "bg-charcoal/50",
                      file.status === "success" && "bg-green-600/50",
                      file.status === "error" && "bg-red-500/50",
                      file.status === "pending" &&
                        "bg-charcoal/0 group-hover:bg-charcoal/30"
                    )}
                  >
                    {file.status === "uploading" && (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    )}
                    {file.status === "success" && (
                      <Check className="w-6 h-6 text-white" />
                    )}
                    {file.status === "error" && (
                      <X className="w-6 h-6 text-white" />
                    )}
                  </div>

                  {/* Botón eliminar */}
                  {file.status === "pending" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="absolute top-1 right-1 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-white"
                    >
                      <X className="w-4 h-4 text-charcoal" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Botón de subir */}
            {pendingFiles.length > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={uploadFiles}
                disabled={isUploading}
                className={cn(
                  "w-full mt-6 py-4 rounded-xl font-[family-name:var(--font-montserrat)] text-sm tracking-wider uppercase transition-all",
                  isUploading
                    ? "bg-taupe text-white cursor-not-allowed"
                    : "bg-charcoal text-white hover:bg-charcoal/90"
                )}
              >
                {isUploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subiendo...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    Subir {pendingFiles.length} foto
                    {pendingFiles.length !== 1 && "s"}
                  </span>
                )}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mensaje de éxito */}
      <AnimatePresence>
        {successCount > 0 && pendingFiles.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <p className="font-[family-name:var(--font-cormorant)] text-2xl text-charcoal mb-2">
              ¡Gracias por compartir!
            </p>
            <p className="font-[family-name:var(--font-montserrat)] text-sm text-warm-gray">
              {successCount} foto{successCount !== 1 && "s"} subida
              {successCount !== 1 && "s"} correctamente
            </p>
            <button
              onClick={() => setFiles([])}
              className="mt-4 font-[family-name:var(--font-montserrat)] text-sm text-gold-accent hover:underline"
            >
              Subir más fotos
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
