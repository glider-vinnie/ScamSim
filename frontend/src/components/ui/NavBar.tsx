import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Shield, BookOpen, BarChart3 } from 'lucide-react'

export const NavBar: React.FC = () => {
  const location = useLocation()

  const navLinks = [
    { to: '/', label: 'Home', icon: <Shield size={16} /> },
    { to: '/library', label: 'Library', icon: <BookOpen size={16} /> },
    { to: '/progress', label: 'Progress', icon: <BarChart3 size={16} /> },
  ]

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-sm border-b border-mist/40">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 font-black text-xl tracking-tight text-navy hover:text-navy-hover transition-colors"
        >
          <div className="p-1.5 bg-navy text-surface rounded-button">
            <Shield size={20} />
          </div>
          <span>ScamSim</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive =
              link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to)
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-label={link.label}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-button text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-teal ${
                  isActive
                    ? 'bg-navy text-surface'
                    : 'text-muted hover:text-ink hover:bg-mist/20'
                }`}
              >
                {link.icon}
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
