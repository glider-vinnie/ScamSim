import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const distDir = path.resolve(rootDir, 'frontend', 'dist')
const srcDir = path.resolve(rootDir, 'frontend', 'src')

console.log('=== ScamSim Security & Bundle Leak Check ===\n')

let hasFailure = false
const errors = []

// 1. Scan frontend/dist for secrets and sensitive patterns
const secretPatterns = [
  { pattern: /AIza[0-9A-Za-z-_]{35}/, name: 'Google API Key (AIza...)' },
  { pattern: /GEMINI_[A-Z0-9_]*KEY/i, name: 'Gemini Key variable' },
  { pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, name: 'Private Key block' },
  { pattern: /\.env\b/, name: '.env reference' },
]

function scanDirectory(dir, filterFn) {
  let results = []
  if (!fs.existsSync(dir)) return results
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results = results.concat(scanDirectory(fullPath, filterFn))
    } else if (filterFn(fullPath)) {
      results.push(fullPath)
    }
  }
  return results
}

console.log('1. Checking frontend/dist for leaked secrets...')
if (!fs.existsSync(distDir)) {
  console.warn('   [WARN] frontend/dist does not exist. Run "npm run build" first.\n')
  errors.push('frontend/dist does not exist')
  hasFailure = true
} else {
  const distFiles = scanDirectory(distDir, (p) => !p.endsWith('.map') && !p.endsWith('.png') && !p.endsWith('.woff') && !p.endsWith('.woff2'))
  for (const file of distFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    for (const { pattern, name } of secretPatterns) {
      if (pattern.test(content)) {
        const rel = path.relative(rootDir, file)
        errors.push(`Secret pattern matched in ${rel}: ${name}`)
        hasFailure = true
      }
    }
  }
  if (!hasFailure) {
    console.log('   [PASS] No secret or sensitive patterns found in frontend/dist.')
  }
}

// 2. Grep frontend/src for credential inputs & dangerous HTML injection
console.log('\n2. Scanning frontend/src for credential inputs and HTML injection...')
const sourceFiles = scanDirectory(srcDir, (p) => /\.(tsx?|jsx?|html)$/.test(p) && !p.includes('.test.'))

const credentialRules = [
  { pattern: /type\s*=\s*["']password["']/i, name: 'Password input (type="password")' },
  { pattern: /inputmode\s*=\s*["']numeric["']/i, name: 'Numeric inputmode (inputmode="numeric")' },
  { pattern: /inputMode\s*=\s*["']numeric["']/i, name: 'Numeric inputMode (inputMode="numeric")' },
  { pattern: /<input[^>]+(placeholder|aria-label|name)\s*=\s*["'][^"']*(PIN|OTP)[^"']*["']/i, name: 'Input with PIN or OTP label/placeholder' },
  { pattern: /dangerouslySetInnerHTML/, name: 'dangerouslySetInnerHTML injection' },
]

let credentialViolations = 0
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf-8')
  for (const rule of credentialRules) {
    if (rule.pattern.test(content)) {
      const rel = path.relative(rootDir, file)
      errors.push(`Safety violation in ${rel}: ${rule.name}`)
      credentialViolations++
      hasFailure = true
    }
  }
}

if (credentialViolations === 0) {
  console.log('   [PASS] Zero PIN/OTP/password inputs and zero dangerouslySetInnerHTML found.')
}

console.log('\n===========================================')
if (hasFailure) {
  console.error('\nSecurity check FAILED with errors:')
  for (const err of errors) {
    console.error(`  - ${err}`)
  }
  process.exit(1)
} else {
  console.log('\nAll security & bundle scans PASSED cleanly!')
  process.exit(0)
}
