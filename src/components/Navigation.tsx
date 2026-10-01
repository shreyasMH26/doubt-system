import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavigationProps {
  activeTab?: string;
}

export const Navigation: React.FC<NavigationProps> = () => {
  const [activeTab, setActiveTab] = useState('Course');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = ['Course', 'Field Guides', 'Geology', 'Plans', 'Live Tour'];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between p-4 sm:p-5">
        {/* Left: Logo + Wordmark */}
        <div className="flex items-center gap-2 cursor-pointer">
          <svg
            width="26"
            height="26"
            viewBox="0 0 256 256"
            fill="#ffffff"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M 256 256 L 128 256 L 0 128 L 128 128 Z M 256 128 L 128 128 L 0 0 L 128 0 Z" />
          </svg>
          <span className="text-white text-2xl font-playfair italic">Lithos</span>
        </div>

        {/* Center pill (desktop) */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-2 py-2 items-center gap-1">
          {navItems.map((item) => {
            const isActive = item === activeTab;
            return (
              <button
                key={item}
                onClick={() => setActiveTab(item)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white bg-white/20'
                    : 'text-white/80 hover:bg-white/20 hover:text-white'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Right (desktop) */}
        <div className="hidden md:block">
          <button className="bg-white text-gray-900 text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors">
            Sign Up
          </button>
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white p-2 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-4 right-4 z-[99] bg-black/90 backdrop-blur-lg border border-white/20 rounded-2xl p-5 flex flex-col gap-3">
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => {
                setActiveTab(item);
                setMobileMenuOpen(false);
              }}
              className={`text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                item === activeTab
                  ? 'bg-white/20 text-white'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item}
            </button>
          ))}
          <div className="pt-2 border-t border-white/10">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-white text-gray-900 text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}
    </>
  );
};
