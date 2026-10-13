/**
 * WCAG 2.1 Contrast Ratio Verification Script
 * Validates brand token combinations according to spec §8.
 */

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}

function relativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hexToRgb(hex1))
  const l2 = relativeLuminance(hexToRgb(hex2))
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

const pairs = [
  // Text pairs (minimum 4.5:1 required)
  { name: 'Navy on White (Primary text / Headings)', fg: '#194777', bg: '#FFFFFF', min: 4.5, type: 'text' },
  { name: 'Ink on White (Body text on card)', fg: '#0E1B2A', bg: '#FFFFFF', min: 4.5, type: 'text' },
  { name: 'Ink on Background (Body text on page)', fg: '#0E1B2A', bg: '#F6F9F9', min: 4.5, type: 'text' },
  { name: 'Muted on White (Secondary text)', fg: '#4A5B6B', bg: '#FFFFFF', min: 4.5, type: 'text' },
  { name: 'Muted on Background (Secondary text on page)', fg: '#4A5B6B', bg: '#F6F9F9', min: 4.5, type: 'text' },
  { name: 'White on Berry (Critical risk badge text)', fg: '#FFFFFF', bg: '#A92343', min: 4.5, type: 'text' },
  { name: 'Navy on Sand (Cautious risk badge / callout)', fg: '#194777', bg: '#EABD82', min: 4.5, type: 'text' },
  { name: 'Navy on Mist (Callout on Mist)', fg: '#194777', bg: '#B2C8CA', min: 4.5, type: 'text' },

  // UI parts / graphical components / large bold elements (minimum 3.0:1 required)
  { name: 'Teal on White (UI component / Icon / Ring)', fg: '#19869B', bg: '#FFFFFF', min: 3.0, type: 'ui' },
  { name: 'Coral on White (Warning border / Icon)', fg: '#E96532', bg: '#FFFFFF', min: 3.0, type: 'ui' },
]

console.log('=== WCAG Contrast Verification ===\n')
let hasFailure = false

for (const pair of pairs) {
  const ratio = contrastRatio(pair.fg, pair.bg)
  const passed = ratio >= pair.min
  const rounded = ratio.toFixed(2)

  const status = passed ? 'PASS' : 'FAIL'
  console.log(`[${status}] ${pair.name}: ${rounded}:1 (required: ≥${pair.min}:1 for ${pair.type})`)

  if (!passed) {
    hasFailure = true
  }
}

console.log('\n==================================')
if (hasFailure) {
  console.error('\nContrast check failed! One or more token pairs do not meet WCAG standards.')
  process.exit(1)
} else {
  console.log('\nAll token pairs meet WCAG standards!')
  process.exit(0)
}
