#!/usr/bin/env node
'use strict';

/**
 * Build script for Inactive Player Exporter.
 *
 * Concatenates every `src/<NN>-*.js` file in numeric order into a single
 * userscript.
 *
 * The same output is written to two locations:
 *   - `dist/InactivePlayerExporter.user.js` (canonical build output)
 *   - `InactivePlayerExporter.user.js` at the repo root (install entry point)
 *
 * - The userscript metadata block lives in `src/00-header.js` and is copied
 *   verbatim as the very first content of the output file.
 * - No minification, no transpilation, no external dependencies.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC_DIR = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'dist');
const OUT_FILE = path.join(OUT_DIR, 'InactivePlayerExporter.user.js');
const ROOT_OUT_FILE = path.join(ROOT, 'InactivePlayerExporter.user.js');

function listSourceFiles() {
    if (!fs.existsSync(SRC_DIR)) {
        throw new Error('src/ directory not found');
    }
    const files = fs.readdirSync(SRC_DIR)
        .filter((name) => /^\d+.*\.js$/i.test(name))
        .sort((a, b) => {
            const na = parseInt(a, 10);
            const nb = parseInt(b, 10);
            if (na !== nb) return na - nb;
            return a.localeCompare(b);
        });
    if (files.length === 0) {
        throw new Error('no numbered source files found in src/');
    }
    return files;
}

function readSource(name) {
    const full = path.join(SRC_DIR, name);
    // Normalize trailing whitespace so concatenation stays tidy.
    return fs.readFileSync(full, 'utf8').replace(/\s*$/, '');
}

function build() {
    const files = listSourceFiles();
    const parts = [];

    files.forEach((name, index) => {
        const content = readSource(name);
        if (index === 0) {
            // Header must stay verbatim at the top of the output file.
            parts.push(content);
        } else {
            parts.push('// \u2500\u2500\u2500\u2500\u2500 src/' + name + ' \u2500\u2500\u2500\u2500\u2500\n' + content);
        }
    });

    const output = parts.join('\n\n') + '\n';

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_FILE, output, 'utf8');
    fs.writeFileSync(ROOT_OUT_FILE, output, 'utf8');

    const kb = (Buffer.byteLength(output, 'utf8') / 1024).toFixed(2);
    console.log('[build] ' + files.length + ' source files -> InactivePlayerExporter.user.js (' + kb + ' KB)');
    console.log('        -> dist/InactivePlayerExporter.user.js');
    console.log('        -> InactivePlayerExporter.user.js (repo root)');
    files.forEach((name) => console.log('        + src/' + name));
}

try {
    build();
} catch (err) {
    console.error('[build] ERROR: ' + err.message);
    process.exit(1);
}
