#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = import.meta.dirname;
const TEMPLATE = path.join(ROOT, 'template.html');
const DATA = path.join(ROOT, 'resume.json');
const PII = path.join(ROOT, 'resume.pii.json');
const DIST = path.join(ROOT, 'dist');
const OUT_HTML = path.join(DIST, 'resume.html');
const OUT_PDF = path.join(DIST, 'resume.pdf');
const OUT_DOCX = path.join(DIST, 'resume.docx');

const args = process.argv.slice(2);
const WATCH = args.includes('--watch');
const PDF_ONLY = args.includes('--pdf');
const DOCX_ONLY = args.includes('--docx');

function timestamp(): string {
  return new Date().toLocaleTimeString();
}

function render(): void {
  const Handlebars = require('handlebars');
  const source = fs.readFileSync(TEMPLATE, 'utf-8');
  const data: Record<string, unknown> = JSON.parse(fs.readFileSync(DATA, 'utf-8'));
  if (fs.existsSync(PII)) {
    const pii: Record<string, unknown> = JSON.parse(fs.readFileSync(PII, 'utf-8'));
    for (const [key, val] of Object.entries(pii)) {
      data[key] =
        typeof val === 'object' && val !== null && !Array.isArray(val)
          ? { ...(data[key] as object), ...val }
          : val;
    }
  }
  const html: string = Handlebars.compile(source)(data);
  fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(OUT_HTML, html);
  console.log(`[${timestamp()}] Rendered → dist/resume.html`);
}

async function buildPDF(): Promise<void> {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`file://${OUT_HTML}`, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: OUT_PDF,
    format: 'Letter',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  await browser.close();
  console.log(`[${timestamp()}] Built    → dist/resume.pdf`);
}

function buildDocx(): void {
  try {
    execSync(`which pandoc`, { stdio: 'ignore' });
  } catch {
    console.error('pandoc not found — install with: brew install pandoc');
    process.exit(1);
  }
  execSync(`pandoc "${OUT_HTML}" -o "${OUT_DOCX}" --from=html`);
  console.log(`[${timestamp()}] Built    → dist/resume.docx`);
}

async function main(): Promise<void> {
  if (WATCH) {
    const chokidar = require('chokidar');
    const browserSync = require('browser-sync').create();

    render();

    browserSync.init({
      server: { baseDir: DIST },
      startPath: 'resume.html',
      open: true,
      notify: false,
      logLevel: 'silent',
      ui: false,
    });

    chokidar.watch([TEMPLATE, DATA, PII], { ignoreInitial: true }).on('change', (file: string) => {
      console.log(`[${timestamp()}] Changed: ${path.relative(ROOT, file)}`);
      try {
        render();
        browserSync.reload();
      } catch (err) {
        console.error('Render error:', (err as Error).message);
      }
    });

    console.log('\nWatching for changes. Edit template.html, resume.json, or resume.pii.json.\n');
    console.log('  npm run pdf   — export PDF');
    console.log('  npm run docx  — export DOCX  (requires: brew install pandoc)');
    console.log('  Ctrl+C        — stop\n');
    return;
  }

  render();

  if (PDF_ONLY) {
    await buildPDF();
    return;
  }

  if (DOCX_ONLY) {
    buildDocx();
    return;
  }

  await buildPDF();
  buildDocx();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
