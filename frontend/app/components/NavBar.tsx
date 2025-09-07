// app/components/NavBar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-[var(--card)] border-b border-[var(--border)] fixed top-0 inset-x-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          {/* Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-lg font-semibold text-[var(--fg)]">
              My Outfit
            </Link>
          </div>

          {/* Desktop links */}
          <div className="hidden sm:flex sm:space-x-6 items-center">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/generate" className="nav-link">Generate</Link>
            <Link href="/wardrobe" className="nav-link">My Wardrobe</Link>
            <ThemeToggle />
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-[var(--fg)] hover:bg-[var(--border)]"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                {menuOpen ? (
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                ) : (
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden bg-[var(--card)] border-t border-[var(--border)]">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md nav-link"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/generate"
              className="block px-3 py-2 rounded-md nav-link"
              onClick={() => setMenuOpen(false)}
            >
              Generate
            </Link>
            <Link
              href="/wardrobe"
              className="block px-3 py-2 rounded-md nav-link"
              onClick={() => setMenuOpen(false)}
            >
              My Wardrobe
            </Link>

            {/* Theme toggle on mobile */}
            <div className="px-3 py-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}