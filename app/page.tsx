"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Camera, Images } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header />

      {/* Hero Section con imagen de fondo */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Imagen de fondo para mobile */}
        <Image
          src="/cabecera-mobile.png"
          alt="Cabecera"
          fill
          className="object-cover md:hidden"
          priority
        />
        {/* Imagen de fondo para desktop */}
        <Image
          src="/cabecera.png"
          alt="Cabecera"
          fill
          className="object-cover hidden md:block"
          priority
        />
        {/* Overlay oscuro para mejor legibilidad */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Contenido del hero */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 text-center px-6"
        >
          {/* Logo */}
          <motion.div variants={itemVariants}>
            <Image
              src="/logo.png"
              alt="Marta & Álvaro"
              width={350}
              height={250}
              className="mx-auto drop-shadow-lg"
              priority
            />
          </motion.div>

          {/* Mensaje */}
          <motion.p
            variants={itemVariants}
            className="font-[family-name:var(--font-cormorant)] text-xl md:text-2xl text-white mt-8 leading-relaxed drop-shadow-md"
          >
            Comparte los momentos más especiales
            <br />
            de nuestro día
          </motion.p>

          {/* Cards de navegación */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto mt-12"
          >
            <Link href="/subir" className="group">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 transition-all duration-300 hover:shadow-xl hover:bg-white hover:-translate-y-1">
                <div className="w-14 h-14 rounded-full bg-beige flex items-center justify-center mx-auto mb-4 group-hover:bg-gold-accent/10 transition-colors">
                  <Camera className="w-7 h-7 text-warm-gray group-hover:text-gold-accent transition-colors" />
                </div>
                <h3 className="font-[family-name:var(--font-playfair)] text-xl text-charcoal mb-2">
                  Subir Fotos
                </h3>
                <p className="font-[family-name:var(--font-montserrat)] text-sm text-warm-gray">
                  Comparte tus recuerdos del evento
                </p>
              </div>
            </Link>

            <Link href="/galeria" className="group">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 transition-all duration-300 hover:shadow-xl hover:bg-white hover:-translate-y-1">
                <div className="w-14 h-14 rounded-full bg-beige flex items-center justify-center mx-auto mb-4 group-hover:bg-gold-accent/10 transition-colors">
                  <Images className="w-7 h-7 text-warm-gray group-hover:text-gold-accent transition-colors" />
                </div>
                <h3 className="font-[family-name:var(--font-playfair)] text-xl text-charcoal mb-2">
                  Ver Galería
                </h3>
                <p className="font-[family-name:var(--font-montserrat)] text-sm text-warm-gray">
                  Explora todos los momentos
                </p>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
