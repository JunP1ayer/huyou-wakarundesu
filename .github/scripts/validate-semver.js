#!/usr/bin/env node
const fs = require('fs');
const semver = require('semver');
const lock = JSON.parse(fs.readFileSync('package-lock.json','utf8'));

function walk(obj, path = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'version' && typeof v === 'string' && !semver.valid(v)) {
      console.error(`❌ Invalid Version "${v}" at ${path.join('.')}.version`);
      process.exitCode = 1;
    }
    if (v && typeof v === 'object') walk(v, [...path, k]);
  }
}
walk(lock);
if (process.exitCode) {
  console.error('Abort: Invalid SemVer detected');
  process.exit(1);
}
console.log('✅ All versions are valid');