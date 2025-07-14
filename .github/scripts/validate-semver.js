#!/usr/bin/env node
const fs = require('fs');

// Simple SemVer validation without external dependencies
function isValidSemver(version) {
  if (!version || typeof version !== 'string') return false;
  
  // Skip workspace protocol
  if (version.startsWith('workspace:')) return true;
  
  // Skip npm protocols
  if (version.startsWith('npm:') || version.startsWith('file:') || 
      version.startsWith('git:') || version.startsWith('http:') || 
      version.startsWith('https:')) return true;
  
  // Basic semver pattern: X.Y.Z with optional pre-release and metadata
  const semverPattern = /^v?(\d+)\.(\d+)\.(\d+)(?:-[\w\d.-]+)?(?:\+[\w\d.-]+)?$/;
  return semverPattern.test(version);
}

const lock = JSON.parse(fs.readFileSync('package-lock.json','utf8'));

function walk(obj, path = []) {
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'version' && typeof v === 'string' && !isValidSemver(v)) {
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