import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/ui'
import {
  LandingPage,
  LibraryPage,
  PlayPage,
  ResultsPage,
  ProgressPage,
  NotFoundPage,
  KitPage,
} from './pages'

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/play/:sessionId" element={<PlayPage />} />
          <Route path="/results/:sessionId" element={<ResultsPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          {import.meta.env.DEV && <Route path="/_kit" element={<KitPage />} />}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}

export default App
