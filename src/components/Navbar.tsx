'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, LayoutDashboard, BarChart3, Bot, Menu, X, Trophy } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/coach', label: 'AI Coach', icon: Bot },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-hi to-primary flex items-center justify-center clay-sm">
              <Flame className="w-5 h-5 text-on-primary" aria-hidden="true" />
            </div>
            <span className="text-xl font-heading font-bold text-foreground">
              Habit<span className="text-primary">Forge</span>
            </span>
          </Link>

          {/* Buildathon Sticker - Desktop */}
          <div className="hidden md:flex items-center">
            <div className="pill bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[11px] shadow-lg shadow-orange-500/25 animate-pulse">
              <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
              Built For Ostad Presents YUNet AIgnite Buildathon 2026
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  pathname === href
                    ? 'bg-primary/15 text-primary clay-sm'
                    : 'text-muted-fg hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
            <div className="ml-2">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile: theme toggle + menu button */}
          <div className="flex md:hidden items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className="p-2.5 rounded-2xl text-muted-fg hover:bg-muted hover:text-foreground transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card animate-fade-in">
          {/* Mobile Buildathon Sticker */}
          <div className="px-4 py-3">
            <div className="pill bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[11px] shadow-lg justify-center w-full">
              <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
              Built For Ostad Presents YUNet AIgnite Buildathon 2026
            </div>
          </div>
          <div className="px-2 pb-3 space-y-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  pathname === href
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-fg hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
