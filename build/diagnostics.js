const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const checks = [];
let passCount = 0;
let failCount = 0;
let warnCount = 0;

function check(name, condition, fix, severity = 'FAIL') {
  const status = condition ? 'PASS' : severity;
  checks.push({ name, status, fix: condition ? '-' : fix });
}

// ─── Section 1: Core File Existence ─────────────────────────────────────
const coreFiles = [
  { file: 'index.html', chunk: '01' },
  { file: 'style.css', chunk: '01' },
  { file: 'package.json', chunk: '01' },
  { file: 'vercel.json', chunk: '01' },
  { file: '.env.example', chunk: '01' },
  { file: '.gitignore', chunk: '01' },
  { file: 'README.md', chunk: '00' },
  { file: 'IMPLEMENTATION_PLAN.md', chunk: '00' },
  { file: 'CHANGELOG.md', chunk: '00' },
  { file: 'COMMANDS.md', chunk: '00' },
  { file: 'TEAMMATE_GUIDE.md', chunk: '00' },
];

coreFiles.forEach(({ file, chunk }) => {
  check(`Core: ${file}`, fs.existsSync(path.join(ROOT, file)), `Create ${file} (Chunk ${chunk})`);
});

// ─── Section 2: JavaScript Modules ──────────────────────────────────────
const jsModules = [
  { file: 'js/app.js', chunk: '03', exports: 'window.app' },
  { file: 'js/utils.js', chunk: '03', exports: 'window.utils' },
  { file: 'js/recorder.js', chunk: '04', exports: 'window.recorder' },
  { file: 'js/processor.js', chunk: '05', exports: 'window.processor' },
  { file: 'js/demo.js', chunk: '05', exports: 'window.demo' },
  { file: 'js/dashboard.js', chunk: '06', exports: 'window.dashboard' },
  { file: 'js/charts.js', chunk: '06', exports: 'window.charts' },
  { file: 'js/export.js', chunk: '06', exports: 'window.exports' },
  { file: 'js/paths.js', chunk: '02', exports: 'window.floatingPaths' },
];

jsModules.forEach(({ file, chunk, exports: exp }) => {
  const fullPath = path.join(ROOT, file);
  const exists = fs.existsSync(fullPath);
  check(`JS: ${file}`, exists, `Create ${file} (Chunk ${chunk})`);

  if (exists && exp) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    check(`JS Export: ${exp}`, content.includes(exp), `${file} must assign to ${exp}`);
  }
});

// ─── Section 3: API Endpoint ────────────────────────────────────────────
const apiPath = path.join(ROOT, 'api/process.js');
const apiExists = fs.existsSync(apiPath);
check('API: api/process.js', apiExists, 'Create api/process.js (Chunk 05)');

if (apiExists) {
  const apiContent = fs.readFileSync(apiPath, 'utf-8');
  check('API: exports default handler', apiContent.includes('export default'), 'api/process.js must export default handler function');
  check('API: maxDuration set', apiContent.includes('maxDuration'), 'Add maxDuration export to avoid Vercel 10s timeout');
  check('API: Gemini SDK imported', apiContent.includes('GoogleGenerativeAI'), 'Import @google/generative-ai');
  check('API: Groq SDK imported', apiContent.includes('groq-sdk') || apiContent.includes('Groq'), 'Import groq-sdk for fallback');
  check('API: CORS headers', apiContent.includes('Access-Control-Allow-Origin'), 'Add CORS headers to handler');
  check('API: JSON response type', apiContent.includes('application/json'), 'Set responseMimeType to application/json for structured output');
  check('API: Audio support moved', !apiContent.includes('inlineData'), 'API process.js should not handle audio anymore (moved to transcribe.js)');
}

const transcribeExists = fs.existsSync(path.join(ROOT, 'api/transcribe.js'));
check('API: api/transcribe.js', transcribeExists, 'Create api/transcribe.js for audio processing');
if (transcribeExists) {
  const transcribeContent = fs.readFileSync(path.join(ROOT, 'api/transcribe.js'), 'utf-8');
  check('API: Groq Whisper support', transcribeContent.includes('groq.audio.transcriptions.create'), 'API transcribe must use Groq Whisper as primary');
  check('API: Gemini 2.5 Fallback', transcribeContent.includes('gemini-2.5-flash'), 'API transcribe must fallback to gemini-2.5-flash');
}

const refineExists = fs.existsSync(path.join(ROOT, 'api/refine.js'));
check('API: api/refine.js', refineExists, 'Create api/refine.js for post-AI corrections');

// ─── Section 4: Build Chunks ────────────────────────────────────────────
const chunkNames = ['MANIFEST', 'SCAFFOLDING', 'UI_DESIGN', 'CORE_APP', 'INPUT_PROCESSING', 'API_ENGINE', 'DASHBOARD_EXPORTS'];
chunkNames.forEach((name, i) => {
  const chunkFile = `build/0${i}_${name}.md`;
  check(`Chunk: ${chunkFile}`, fs.existsSync(path.join(ROOT, chunkFile)), `Create ${chunkFile}`);
});

// ─── Section 5: Dependencies ────────────────────────────────────────────
check('Deps: node_modules exists', fs.existsSync(path.join(ROOT, 'node_modules')), 'Run: npm install');

const pkgPath = path.join(ROOT, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const deps = pkg.dependencies || {};
  check('Deps: @google/generative-ai', !!deps['@google/generative-ai'], 'Run: npm install @google/generative-ai');
  check('Deps: groq-sdk', !!deps['groq-sdk'], 'Run: npm install groq-sdk');
  check('Deps: dotenv', !!deps['dotenv'], 'Run: npm install dotenv');
}

// ─── Section 6: Environment ─────────────────────────────────────────────
const envExists = fs.existsSync(path.join(ROOT, '.env'));
check('Env: .env file exists', envExists, 'Copy .env.example to .env and add your API keys');

if (envExists) {
  const envContent = fs.readFileSync(path.join(ROOT, '.env'), 'utf-8');
  check('Env: GEMINI_API_KEY set', envContent.includes('GEMINI_API_KEY=') && !envContent.includes('your_gemini'), 'Add your Gemini API key to .env');
  check('Env: GROQ_API_KEY set', envContent.includes('GROQ_API_KEY=') && !envContent.includes('your_groq'), 'Add your Groq API key to .env');
}

// ─── Section 7: CSS Design Tokens ───────────────────────────────────────
const cssPath = path.join(ROOT, 'style.css');
if (fs.existsSync(cssPath)) {
  const css = fs.readFileSync(cssPath, 'utf-8');
  check('CSS: color tokens', css.includes('--color-primary'), 'Add --color-primary to :root in style.css');
  check('CSS: font tokens', css.includes('--font-heading'), 'Add --font-heading to :root in style.css');
  check('CSS: spacing tokens', css.includes('--space-md'), 'Add --space-md to :root in style.css');
  check('CSS: border-radius tokens', css.includes('--radius-'), 'Add --radius-* tokens to :root in style.css');
  check('CSS: dark/light theming', css.includes('[data-theme') || css.includes('prefers-color-scheme') || css.includes('--color-bg'), 'Add theme support via [data-theme] or CSS custom properties');
}

// ─── Section 8: HTML Structure ──────────────────────────────────────────
const htmlPath = path.join(ROOT, 'index.html');
if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, 'utf-8');
  check('HTML: landing-view', html.includes('id="landing-view"'), 'Add landing-view section');
  check('HTML: input-view', html.includes('id="input-view"'), 'Add input-view section');
  check('HTML: preview-view', html.includes('id="preview-view"'), 'Add preview-view section');
  check('HTML: loading-view', html.includes('id="loading-view"'), 'Add loading-view section');
  check('HTML: dashboard-view', html.includes('id="dashboard-view"'), 'Add dashboard-view section');
  check('HTML: DOMPurify CDN', html.includes('dompurify') || html.includes('DOMPurify'), 'Add DOMPurify CDN script');
  check('HTML: Chart.js CDN', html.includes('chart.js') || html.includes('Chart'), 'Add Chart.js CDN script');
  check('HTML: jsPDF CDN', html.includes('jspdf'), 'Add jsPDF CDN script');
  check('HTML: Lucide Icons CDN', html.includes('lucide'), 'Add Lucide Icons CDN script');
  check('HTML: Google Fonts', html.includes('fonts.googleapis.com'), 'Add Google Fonts link');
  check('HTML: Meta description', html.includes('meta name="description"'), 'Add meta description for SEO');

  // Dashboard dynamic IDs
  const dashboardIds = ['stat-actions', 'stat-speakers', 'health-score-value', 'health-score-circle', 'health-reasoning', 'meeting-summary-text', 'decisions-list', 'questions-list', 'not-discussed-list', 'person-tabs', 'person-panes', 'talkTimeChart'];
  dashboardIds.forEach(id => {
    check(`HTML ID: #${id}`, html.includes(`id="${id}"`), `Add element with id="${id}" in dashboard-view`);
  });
}

// ─── Section 9: Security ────────────────────────────────────────────────
const vercelJson = path.join(ROOT, 'vercel.json');
if (fs.existsSync(vercelJson)) {
  const vercel = fs.readFileSync(vercelJson, 'utf-8');
  check('Security: CSP headers', vercel.includes('Content-Security-Policy'), 'Add CSP headers to vercel.json');
  check('Security: X-Frame-Options', vercel.includes('X-Frame-Options'), 'Add X-Frame-Options to vercel.json');
  check('Security: nosniff', vercel.includes('nosniff'), 'Add X-Content-Type-Options: nosniff');
}

// ─── Section 10: Vercel Config ──────────────────────────────────────────
if (fs.existsSync(vercelJson)) {
  const vercelContent = fs.readFileSync(vercelJson, 'utf-8');
  // Explicit routes block causes issues — should not exist
  check('Vercel: no explicit routes', !vercelContent.includes('"routes"'), 'Remove "routes" from vercel.json — causes API 404');
  check('Vercel: no explicit builds', !vercelContent.includes('"builds"'), 'Remove "builds" from vercel.json — causes deploy issues');
}

// ─── Print Results ──────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════╗');
console.log('║       MEETMIND DIAGNOSTICS v2.0          ║');
console.log('╚══════════════════════════════════════════╝\n');

const sections = {
  'Core Files': checks.filter(c => c.name.startsWith('Core:')),
  'JavaScript Modules': checks.filter(c => c.name.startsWith('JS')),
  'API Endpoint': checks.filter(c => c.name.startsWith('API:')),
  'Build Chunks': checks.filter(c => c.name.startsWith('Chunk:')),
  'Dependencies': checks.filter(c => c.name.startsWith('Deps:')),
  'Environment': checks.filter(c => c.name.startsWith('Env:')),
  'CSS Design Tokens': checks.filter(c => c.name.startsWith('CSS:')),
  'HTML Structure': checks.filter(c => c.name.startsWith('HTML')),
  'Security': checks.filter(c => c.name.startsWith('Security:')),
  'Vercel Config': checks.filter(c => c.name.startsWith('Vercel:')),
};

Object.entries(sections).forEach(([section, items]) => {
  if (items.length === 0) return;
  console.log(`\n── ${section} ${'─'.repeat(40 - section.length)}`);
  items.forEach(c => {
    if (c.status === 'PASS') {
      console.log(`  ✅ ${c.name}`);
      passCount++;
    } else if (c.status === 'WARN') {
      console.log(`  ⚠️  ${c.name}`);
      console.log(`       → ${c.fix}`);
      warnCount++;
    } else {
      console.log(`  ❌ ${c.name}`);
      console.log(`       → ${c.fix}`);
      failCount++;
    }
  });
});

console.log('\n╔══════════════════════════════════════════╗');
console.log(`║  ✅ ${passCount} passed  ❌ ${failCount} failed  ⚠️  ${warnCount} warnings    ║`);
console.log('╚══════════════════════════════════════════╝\n');

if (failCount === 0 && warnCount === 0) {
  console.log('🎉 All checks passed. Project is production-ready.\n');
} else if (failCount === 0) {
  console.log('✨ No failures. Fix warnings for best results.\n');
} else {
  console.log('🔧 Fix the failing checks before deploying.\n');
}

process.exit(failCount > 0 ? 1 : 0);
