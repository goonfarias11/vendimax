"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Columna 1: Sobre VendiMax */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <span className="text-xl font-bold text-white">VendiMax</span>
            </div>
            <p className="text-sm mb-4">
              La solución completa de punto de venta para negocios modernos que buscan eficiencia y crecimiento.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/gonzaloo.hhfa/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://x.com/farias_goon"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/goondev_/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/gonzalo-farias-8a584723b/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Columna 2: Producto */}
          <div>
            <h3 className="text-white font-semibold mb-4">Producto</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#funciones" className="hover:text-primary transition-colors">
                  Funcionalidades
                </Link>
              </li>
              <li>
                <Link href="#precios" className="hover:text-primary transition-colors">
                  Precios
                </Link>
              </li>
              <li>
                <Link href="#demo" className="hover:text-primary transition-colors">
                  Demo
                </Link>
              </li>
              <li>
                <Link href="/integraciones" className="hover:text-primary transition-colors">
                  Integraciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 3: Recursos */}
          <div>
            <h3 className="text-white font-semibold mb-4">Recursos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/blog" className="hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-primary transition-colors">
                  Centro de Ayuda
                </Link>
              </li>
              <li>
                <Link href="/tutoriales" className="hover:text-primary transition-colors">
                  Tutoriales
                </Link>
              </li>
              <li>
                <Link href="/docs/api" className="hover:text-primary transition-colors">
                  Documentacion API
                </Link>
              </li>
            </ul>
          </div>

          {/* Columna 4: Contacto */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <Mail className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <a href="mailto:soportevendimax@gmail.com" className="hover:text-primary transition-colors">
                  soportevendimax@gmail.com
                </a>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <a href="tel:3543515007" className="hover:text-primary transition-colors">
                  3543515007
                </a>
              </li>
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>Córdoba, Argentina</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm">
              © {currentYear} VendiMax. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link href="/legal/privacidad" className="hover:text-primary transition-colors">
                Política de Privacidad
              </Link>
              <Link href="/legal/terminos" className="hover:text-primary transition-colors">
                Términos y Condiciones
              </Link>
              <Link href="/soporte" className="hover:text-primary transition-colors">
                Soporte
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

