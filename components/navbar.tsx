"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <span className="text-xl font-bold text-gray-900">VendiMax</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#beneficios" className="text-gray-700 hover:text-primary transition-colors">
              Beneficios
            </Link>
            <Link href="/precios" className="text-gray-700 hover:text-primary transition-colors">
              Precios
            </Link>
            <Link href="/soporte" className="text-gray-700 hover:text-primary transition-colors">
              Soporte
            </Link>
            <Link href="/demo" className="text-gray-700 hover:text-primary transition-colors">
              Demo
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/registro">Empezar Gratis</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 pt-2 pb-4 space-y-2">
            <Link
              href="#beneficios"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Beneficios
            </Link>
            <Link
              href="/precios"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Precios
            </Link>
            <Link
              href="/soporte"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Soporte
            </Link>
            <Link
              href="#demo"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Demo
            </Link>
            <div className="pt-4 space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
              <Button className="w-full" asChild>
                <Link href="/registro">Empezar Gratis</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
