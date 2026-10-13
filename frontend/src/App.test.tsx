import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import { COPY } from './lib/copy'

describe('App', () => {
  it('renders application headline and simulation disclaimer', () => {
    render(<App />)
    expect(screen.getByText(COPY.appName)).toBeInTheDocument()
    expect(screen.getByText(COPY.tagline)).toBeInTheDocument()
    expect(screen.getByText(COPY.simulationBanner)).toBeInTheDocument()
  })
})
