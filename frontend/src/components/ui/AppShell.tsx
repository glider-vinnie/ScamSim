import React from 'react'
import { NavBar } from './NavBar'
import { COPY } from '../../lib/copy'

export interface AppShellProps {
  children: React.ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-sans">
      <NavBar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8">{children}</main>
      <footer className="border-t border-mist/40 bg-surface py-6 px-4 text-center text-xs text-muted">
        <div className="max-w-3xl mx-auto space-y-2">
          <p className="font-semibold text-navy">{COPY.disclaimer}</p>
          <p>© {new Date().getFullYear()} ScamSim. Educational financial safety simulator.</p>
        </div>
      </footer>
    </div>
  )
}
