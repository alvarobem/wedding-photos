import { Heart } from "lucide-react";
export function Footer() {
  return (
    <footer className="py-8 text-center border-t border-sand/50">
      <div className="w-full mx-auto  p-5 flex items-center justify-center">
            <div className="flex text-sm text-stone-600 sm:text-center dark:text-stone-400">
              <p className="mr-1">© 2025. Hecho con  </p>
              <Heart className="w-4 h-4"></Heart>
              <p className="ml-1">por Marta y Álvaro.</p>
          </div>
          
          </div>
    </footer>
  );
}
