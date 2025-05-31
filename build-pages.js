#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('Building for Cloudflare Pages...');

try {
  // Build frontend with Vite
  console.log('Building frontend...');
  execSync('vite build', { stdio: 'inherit' });
  
  console.log('Build completed successfully for Cloudflare Pages!');
  console.log('Output directory: dist/');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}