"use client";

import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PhotoUploader } from "@/components/upload/PhotoUploader";

export default function SubirPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />

      <main className="flex-1 px-6 pt-36 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          {/* Título */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-12 h-px bg-sand" />
              <div className="w-1.5 h-1.5 rotate-45 bg-gold-accent" />
              <div className="w-12 h-px bg-sand" />
            </div>

            <h1 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl text-charcoal mb-4">
              Comparte tus fotos
            </h1>

            <p className="font-[family-name:var(--font-cormorant)] text-xl text-warm-gray">
              Arrastra tus mejores momentos de la boda
            </p>
          </div>

          {/* Uploader */}
          <PhotoUploader />
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
