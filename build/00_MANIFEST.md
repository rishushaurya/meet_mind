# Chunk 00: Build Manifest

> Build order, dependency graph, and diagnostics.

---

## Build Order

| Chunk | Name | Depends On | Status | Verified |
|-------|------|------------|--------|----------|
| 00 | Manifest + Diagnostics | None | COMPLETE | YES |
| 01 | Scaffolding | 00 | COMPLETE | YES |
| 02 | UI/UX Design | 01 + User Design Input | NOT STARTED | - |
| 03 | Core App Logic | 02 | NOT STARTED | - |
| 04 | Input Processing | 03 | NOT STARTED | - |
| 05 | API Engine | 03 | NOT STARTED | - |
| 06 | Dashboard + Exports | 03, 05 | NOT STARTED | - |

## Dependency Graph

```
00 Manifest
  |
01 Scaffolding
  |
  +-- [USER PROVIDES DESIGN INPUT] --+
  |                                   |
02 UI/UX Design                       |
  |                                   |
03 Core App Logic <-------------------+
  |         |
  |         +----------+
  v                    v
04 Input Processing   05 API Engine
  |                    |
  +----------+---------+
             |
             v
         06 Dashboard + Exports
```

## Diagnostics Script

Save as `build/diagnostics.js` and run with `node build/diagnostics.js`:

```javascript
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const checks = [];

function check(name, condition, fix) {
  const status = condition ? 'PASS' : 'FAIL';
  checks.push({ name, status, fix: condition ? '-' : fix });
}

// File existence checks
const requiredFiles = [
  'index.html', 'style.css', 'package.json', 'vercel.json',
  '.env.example', '.gitignore', 'README.md', 'IMPLEMENTATION_PLAN.md',
  'CHANGELOG.md', 'COMMANDS.md', 'TEAMMATE_GUIDE.md'
];

requiredFiles.forEach(f => {
  check(`File: ${f}`, fs.existsSync(path.join(ROOT, f)), `Create ${f}`);
});

// JS file checks
const jsFiles = [
  'js/app.js', 'js/recorder.js', 'js/processor.js', 'js/dashboard.js',
  'js/charts.js', 'js/export.js', 'js/demo.js', 'js/utils.js'
];

jsFiles.forEach(f => {
  check(`File: ${f}`, fs.existsSync(path.join(ROOT, f)), `Create ${f} (Chunk 03-06)`);
});

// API file check
check('File: api/process.js', fs.existsSync(path.join(ROOT, 'api/process.js')), 'Create api/process.js (Chunk 05)');

// Dependencies check
check('node_modules exists', fs.existsSync(path.join(ROOT, 'node_modules')), 'Run: npm install');

// Env check
const envExists = fs.existsSync(path.join(ROOT, '.env'));
check('.env file exists', envExists, 'Copy .env.example to .env and add your API keys');

if (envExists) {
  const envContent = fs.readFileSync(path.join(ROOT, '.env'), 'utf-8');
  check('GEMINI_API_KEY set', envContent.includes('GEMINI_API_KEY=') && !envContent.includes('your_gemini'), 'Add your Gemini API key to .env');
  check('GROQ_API_KEY set', envContent.includes('GROQ_API_KEY=') && !envContent.includes('your_groq'), 'Add your Groq API key to .env');
}

// Style.css custom properties check
if (fs.existsSync(path.join(ROOT, 'style.css'))) {
  const css = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf-8');
  check('CSS has custom properties', css.includes('--color-'), 'Add CSS custom properties to style.css');
}

// Print results
console.log('\n=== MEETMIND DIAGNOSTICS ===\n');
let passCount = 0;
let failCount = 0;

checks.forEach(c => {
  const icon = c.status === 'PASS' ? '[PASS]' : '[FAIL]';
  console.log(`${icon} ${c.name}`);
  if (c.status === 'FAIL') {
    console.log(`       Fix: ${c.fix}`);
    failCount++;
  } else {
    passCount++;
  }
});

console.log(`\n--- ${passCount} passed, ${failCount} failed ---\n`);

if (failCount === 0) {
  console.log('All checks passed. Project is healthy.');
} else {
  console.log('Fix the failing checks before proceeding.');
}
```
