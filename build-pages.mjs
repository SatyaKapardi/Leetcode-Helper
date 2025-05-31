#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('Building for Cloudflare Pages...');

try {
  // Build frontend with direct vite path
  console.log('Building frontend...');
  execSync('./node_modules/.bin/vite build', { stdio: 'inherit' });
  
  console.log('Build completed successfully for Cloudflare Pages!');
  console.log('Output directory: dist/');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
