#!/usr/bin/env node
// One command to set the app version everywhere it is stored, and to check that they all agree.
//
//   node tools/set-version.mjs 1.2.0 25     set version 1.2.0, build number 25
//   node tools/set-version.mjs --check      exit 1 if the files disagree (handy in CI)
//   node tools/set-version.mjs              print the current versions
//
// Android (versionName/versionCode), iOS, macOS, Windows and Linux builds all read pubspec.yaml, so that file is the
// source of truth. The others are kept in step: the fallback numbers in app_info.dart (shown if the platform cannot
// report the real ones) and the website's package.json and its entry in package-lock.json.
// Firmware (FW_VERSION in firmware/*/platformio.ini) is versioned separately on purpose: it is flashed to collars.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = (p) => join(root, p);
const read = (p) => readFileSync(path(p), 'utf8');

const PUBSPEC = 'pubspec.yaml';
const APP_INFO = 'lib/core/app_info.dart';
const WEB_PKG = 'web/package.json';
const LOCK = 'package-lock.json';

/** Each place: how to read its version and build, and how to rewrite them. */
const places = [
  {
    file: PUBSPEC,
    // [ \t]* rather than \s*: \s would also swallow the line break and the blank line after the version
    read(t) { const m = t.match(/^version:[ \t]*(\d+\.\d+\.\d+)\+(\d+)[ \t]*$/m); return m && { version: m[1], build: m[2] }; },
    write(t, v, b) { return t.replace(/^version:[ \t]*\d+\.\d+\.\d+\+\d+[ \t]*$/m, `version: ${v}+${b}`); },
  },
  {
    file: APP_INFO,
    read(t) {
      const v = t.match(/static String version = '(\d+\.\d+\.\d+)';/);
      const b = t.match(/static String buildNumber = '(\d+)';/);
      return v && b && { version: v[1], build: b[1] };
    },
    write(t, v, b) {
      return t
        .replace(/static String version = '[^']*';/, `static String version = '${v}';`)
        .replace(/static String buildNumber = '[^']*';/, `static String buildNumber = '${b}';`)
        .replace(/\/\/\/ e\.g\. "v[\d.]+ \(Build \d+\)"/, `/// e.g. "v${v} (Build ${b})"`)
        .replace(/\/\/\/ e\.g\. "v[\d.]+\+\d+"/, `/// e.g. "v${v}+${b}"`);
    },
  },
  {
    file: WEB_PKG,
    read(t) { const m = t.match(/^\s*"version":\s*"(\d+\.\d+\.\d+)"/m); return m && { version: m[1] }; },
    write(t, v) { return t.replace(/^(\s*"version":\s*)"\d+\.\d+\.\d+"/m, `$1"${v}"`); },
  },
  {
    file: LOCK,
    // only the website's own entry ("web": { "name": "pet-maya-web", "version": … }), never a dependency
    read(t) { const m = t.match(/"name": "pet-maya-web",\s*"version": "(\d+\.\d+\.\d+)"/); return m && { version: m[1] }; },
    write(t, v) { return t.replace(/("name": "pet-maya-web",\s*"version": )"\d+\.\d+\.\d+"/, `$1"${v}"`); },
  },
];

const current = () => places.map((p) => ({ file: p.file, ...(p.read(read(p.file)) || { version: '??', build: undefined }) }));

function show(rows) {
  for (const r of rows) console.log(`  ${r.file.padEnd(24)} ${r.version}${r.build ? `+${r.build}` : ''}`);
}

function agree(rows) {
  const truth = rows[0];
  return rows.every((r) => r.version === truth.version && (r.build === undefined || r.build === truth.build));
}

const [a, b] = process.argv.slice(2);

if (a === '--check') {
  const rows = current();
  show(rows);
  if (!agree(rows)) { console.error('\nThe version differs between files. Run: node tools/set-version.mjs <x.y.z> <build>'); process.exit(1); }
  console.log('\nAll versions agree.');
  process.exit(0);
}

if (!a) { show(current()); process.exit(0); }

if (!/^\d+\.\d+\.\d+$/.test(a) || !/^\d+$/.test(b || '')) {
  console.error('Usage: node tools/set-version.mjs <major.minor.patch> <build number>   e.g. 1.2.0 25');
  process.exit(2);
}

const before = current();
const old = before[0];
if (Number(b) <= Number(old.build) && a === old.version) {
  console.error(`Build number ${b} must be higher than the current ${old.build} for the same version (Google Play rejects repeats).`);
  process.exit(2);
}
if (Number(b) <= Number(old.build)) {
  console.warn(`Warning: build number ${b} is not higher than the current ${old.build}. Google Play needs every upload's build number to be higher than the last.`);
}

for (const p of places) {
  const text = read(p.file);
  const next = p.write(text, a, b);
  if (next === text && p.read(text)?.version !== a) { console.error(`Could not update ${p.file}`); process.exit(1); }
  if (next !== text) writeFileSync(path(p.file), next);
}

const after = current();
console.log(`Version set to ${a}+${b}:`);
show(after);
if (!agree(after)) { console.error('\nSomething did not update. Check the files above.'); process.exit(1); }
