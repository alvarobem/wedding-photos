"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/subir", label: "Subir Fotos" },
  { href: "/galeria", label: "Galería" },
  
];

export function Header() {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-md border-b border-sand/50"
    >
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="flex flex-col items-center gap-3">
         
 

          {/* Navegación */}
          <nav className="flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative font-[family-name:var(--font-montserrat)] text-sm tracking-wider uppercase transition-colors",
                  pathname === item.href
                    ? "text-charcoal"
                    : "text-warm-gray hover:text-charcoal"
                )}
              >
                {item.label}
                {pathname === item.href && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gold-accent"
                    transition={{ duration: 0.3 }}
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
