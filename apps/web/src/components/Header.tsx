'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function Header() {
  const { theme, setThemeMode } = useTheme();
  const [showContactTip, setShowContactTip] = useState(false);

  const CONTACT_EMAIL = '25pagesscript@gmail.com';

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        {/* Theme Switch */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setThemeMode('light')}
            className={`w-5 h-5 rounded bg-white border-2 transition-all ${
              theme === 'light' ? 'border-accent border-[2.5px]' : 'border-border'
            }`}
            aria-label="Light mode"
          />
          <button
            onClick={() => setThemeMode('dark')}
            className={`w-5 h-5 rounded bg-black border-2 transition-all ${
              theme === 'dark' ? 'border-accent border-[2.5px]' : 'border-border'
            }`}
            aria-label="Dark mode"
          />
        </div>

        {/* Logo */}
        <Link href="/" className="flex flex-col items-center">
          <span className="text-3xl md:text-4xl font-bold italic tracking-tight text-foreground">
            25PageScript
          </span>
          <span className="text-sm text-text-secondary mt-1">
            Share short, powerful & engaging scripts
          </span>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-0.5">
          {/* Info Button */}
          <div className="relative">
            <button
              onClick={() => setShowContactTip(!showContactTip)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-foreground transition-colors"
              aria-label="Contact info"
            >
              <span className="text-xl font-bold">i</span>
            </button>

            {/* Contact Tooltip */}
            {showContactTip && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowContactTip(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl py-6 px-7 shadow-lg min-w-[280px]">
                  <h3 className="text-lg font-bold text-foreground mb-2">Contact Us</h3>
                  <p className="text-sm text-text-secondary mb-3">
                    Have a query? Reach out to us at
                  </p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-accent font-semibold hover:underline"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </>
            )}
          </div>

          {/* Upload Button */}
          <Link
            href="/upload"
            className="w-11 h-11 rounded-full flex items-center justify-center text-foreground hover:bg-secondary-bg transition-colors"
            aria-label="Upload script"
          >
            <span className="text-3xl font-light leading-none">+</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
