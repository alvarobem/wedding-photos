"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Loader2, ImageOff, Download, Check, X as XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  name: string;
  uploadedBy: string;
  createdAt: string;
  thumbnail: string;
  fullSize: string;
}

export function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [longPressIndex, setLongPressIndex] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const loadPhotos = useCallback(async (pageToken?: string) => {
    try {
      if (pageToken) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({ pageSize: "20" });
      if (pageToken) params.set("pageToken", pageToken);

      const response = await fetch(`/api/photos?${params}`);

      if (!response.ok) {
        throw new Error("Error al cargar las fotos");
      }

      const data = await response.json();

      setPhotos((prev) =>
        pageToken ? [...prev, ...data.photos] : data.photos
      );
      setNextPageToken(data.nextPageToken || null);
      setHasMore(data.hasMore ?? !!data.nextPageToken);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Cleanup del long press timer
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Infinite scroll con IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loadingMore && nextPageToken) {
          loadPhotos(nextPageToken);
        }
      },
      {
        root: null,
        rootMargin: "200px", // Cargar antes de llegar al final
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, nextPageToken, loadPhotos]);

  // Función para descargar una imagen
  const downloadPhoto = async (photo: Photo) => {
    try {
      const response = await fetch(photo.fullSize);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = photo.name || `foto-${photo.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar:", err);
    }
  };

  // Función para descargar múltiples fotos
  const downloadSelectedPhotos = async () => {
    if (selectedPhotos.size === 0) return;
    setDownloading(true);

    const photosToDownload = photos.filter((p) => selectedPhotos.has(p.id));

    for (const photo of photosToDownload) {
      await downloadPhoto(photo);
      // Pequeña pausa entre descargas para no saturar
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setDownloading(false);
    setSelectedPhotos(new Set());
    setIsSelectionMode(false);
  };

  // Toggle selección de foto
  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  // Seleccionar/deseleccionar todas
  const toggleSelectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map((p) => p.id)));
    }
  };

  // Long press handlers para móvil
  const LONG_PRESS_DURATION = 500; // ms

  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    setLongPressIndex(index);

    longPressTimer.current = setTimeout(() => {
      // Activar modo selección y seleccionar esta foto
      setIsSelectionMode(true);
      setSelectedPhotos((prev) => {
        const newSet = new Set(prev);
        newSet.add(photos[index].id);
        return newSet;
      });
      // Vibración táctil si está disponible
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      setLongPressIndex(null);
    }, LONG_PRESS_DURATION);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current || !longPressTimer.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

    // Si se mueve más de 10px, cancelar el long press (está haciendo scroll)
    if (deltaX > 10 || deltaY > 10) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      setLongPressIndex(null);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setLongPressIndex(null);
  };

  const openLightbox = (index: number) => {
    if (isSelectionMode) {
      togglePhotoSelection(photos[index].id);
      return;
    }
    setSelectedIndex(index);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
    document.body.style.overflow = "";
  };

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;

      switch (e.key) {
        case "Escape":
          closeLightbox();
          break;
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, photos.length]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gold-accent animate-spin mb-4" />
        <p className="font-[family-name:var(--font-montserrat)] text-warm-gray">
          Cargando fotos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <ImageOff className="w-8 h-8 text-red-500" />
        </div>
        <p className="font-[family-name:var(--font-cormorant)] text-xl text-charcoal mb-2">
          No se pudieron cargar las fotos
        </p>
        <p className="font-[family-name:var(--font-montserrat)] text-sm text-warm-gray mb-4">
          {error}
        </p>
        <button
          onClick={() => loadPhotos()}
          className="font-[family-name:var(--font-montserrat)] text-sm text-gold-accent hover:underline"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full bg-beige flex items-center justify-center mb-4">
          <ImageOff className="w-8 h-8 text-warm-gray" />
        </div>
        <p className="font-[family-name:var(--font-cormorant)] text-xl text-charcoal mb-2">
          Aún no hay fotos
        </p>
        <p className="font-[family-name:var(--font-montserrat)] text-sm text-warm-gray">
          ¡Sé el primero en compartir un momento!
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Barra de acciones de selección */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => {
            setIsSelectionMode(!isSelectionMode);
            if (isSelectionMode) {
              setSelectedPhotos(new Set());
            }
          }}
          className={cn(
            "px-4 py-2 rounded-lg font-[family-name:var(--font-montserrat)] text-sm transition-colors",
            isSelectionMode
              ? "bg-gold-accent text-white"
              : "bg-white border border-sand text-charcoal hover:border-gold-accent"
          )}
        >
          {isSelectionMode ? "Cancelar selección" : "Seleccionar fotos"}
        </button>

        {isSelectionMode && (
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="px-4 py-2 rounded-lg font-[family-name:var(--font-montserrat)] text-sm bg-white border border-sand text-charcoal hover:border-gold-accent transition-colors"
            >
              {selectedPhotos.size === photos.length ? "Deseleccionar todas" : "Seleccionar todas"}
            </button>
            <span className="font-[family-name:var(--font-montserrat)] text-sm text-warm-gray">
              {selectedPhotos.size} seleccionada{selectedPhotos.size !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Barra flotante de descarga */}
      <AnimatePresence>
        {selectedPhotos.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-charcoal text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4"
          >
            <span className="font-[family-name:var(--font-montserrat)] text-sm">
              {selectedPhotos.size} foto{selectedPhotos.size !== 1 ? "s" : ""} seleccionada{selectedPhotos.size !== 1 ? "s" : ""}
            </span>
            <button
              onClick={downloadSelectedPhotos}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-gold-accent rounded-full font-[family-name:var(--font-montserrat)] text-sm hover:bg-gold-accent/90 transition-colors disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Descargando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Descargar
                </>
              )}
            </button>
            <button
              onClick={() => {
                setSelectedPhotos(new Set());
                setIsSelectionMode(false);
              }}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid de fotos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: (index % 20) * 0.05 }}
            className={cn(
              "relative aspect-square rounded-xl overflow-hidden cursor-pointer group select-none",
              index % 7 === 0 && "sm:col-span-2 sm:row-span-2"
            )}
            onClick={() => openLightbox(index)}
            onTouchStart={(e) => handleTouchStart(index, e)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            {/* Imagen con placeholder */}
            <div className="absolute inset-0 bg-sand animate-pulse" />
            <img
              src={photo.thumbnail}
              alt={`Foto de ${photo.uploadedBy}`}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onLoad={(e) => {
                const target = e.target as HTMLImageElement;
                target.previousElementSibling?.remove();
              }}
            />

            {/* Indicador de selección */}
            {isSelectionMode && (
              <div
                className={cn(
                  "absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors z-10",
                  selectedPhotos.has(photo.id)
                    ? "bg-gold-accent border-gold-accent"
                    : "bg-white/80 border-white/80 group-hover:border-gold-accent"
                )}
              >
                {selectedPhotos.has(photo.id) && (
                  <Check className="w-4 h-4 text-white" />
                )}
              </div>
            )}

            {/* Overlay seleccionado */}
            {isSelectionMode && selectedPhotos.has(photo.id) && (
              <div className="absolute inset-0 bg-gold-accent/20 pointer-events-none" />
            )}

            {/* Indicador de long press */}
            {longPressIndex === index && (
              <motion.div
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 0.95, opacity: 1 }}
                className="absolute inset-0 bg-charcoal/30 pointer-events-none z-20 flex items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full border-2 border-white/50 border-t-white animate-spin" />
              </motion.div>
            )}

            {/* Overlay hover */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent transition-opacity duration-300",
              isSelectionMode ? "opacity-0" : "opacity-0 group-hover:opacity-100"
            )}>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="font-[family-name:var(--font-montserrat)] text-white text-sm truncate">
                  {photo.uploadedBy}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sentinel para infinite scroll */}
      <div ref={sentinelRef} className="h-4" />

      {/* Indicador de carga */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-gold-accent animate-spin" />
        </div>
      )}

      {/* Mensaje cuando no hay más fotos */}
      {!hasMore && photos.length > 0 && (
        <div className="flex justify-center py-8">
          <p className="font-[family-name:var(--font-montserrat)] text-sm text-warm-gray">
            Has visto todas las fotos
          </p>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Botones superiores */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
              {/* Botón descargar */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadPhoto(photos[selectedIndex]);
                }}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                title="Descargar foto"
              >
                <Download className="w-6 h-6" />
              </button>
              {/* Botón cerrar */}
              <button
                onClick={closeLightbox}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navegación izquierda */}
            {selectedIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Imagen */}
            <motion.img
              key={photos[selectedIndex].id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              src={photos[selectedIndex].fullSize}
              alt={`Foto de ${photos[selectedIndex].uploadedBy}`}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Navegación derecha */}
            {selectedIndex < photos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Info de la foto */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
              <p className="font-[family-name:var(--font-montserrat)] text-white/80 text-sm">
                {photos[selectedIndex].uploadedBy}
              </p>
              <p className="font-[family-name:var(--font-montserrat)] text-white/50 text-xs mt-1">
                {selectedIndex + 1} / {photos.length}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
