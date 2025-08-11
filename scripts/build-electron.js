#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building BOQ Builder for distribution...\n');

// Clean previous builds
console.log('🧹 Cleaning previous builds...');
try {
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  if (fs.existsSync('dist-electron')) {
    fs.rmSync('dist-electron', { recursive: true, force: true });
  }
} catch (error) {
  console.warn('Warning: Could not clean previous builds:', error.message);
}

// Build the React app
console.log('⚛️  Building React application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ React build completed\n');
} catch (error) {
  console.error('❌ React build failed:', error.message);
  process.exit(1);
}

// Verify dist folder exists
if (!fs.existsSync('dist')) {
  console.error('❌ Dist folder not found after build');
  process.exit(1);
}

// Create assets directory if it doesn't exist
if (!fs.existsSync('assets')) {
  fs.mkdirSync('assets');
  console.log('📁 Created assets directory');
}

// Check for icon file
const iconPath = path.join('assets', 'icon.ico');
if (!fs.existsSync(iconPath)) {
  console.log('⚠️  Warning: No icon.ico found in assets directory');
  console.log('   The app will use the default Electron icon');
}

// Build Electron app
console.log('🔧 Building Electron application...');
try {
  execSync('npx electron-builder --win', { stdio: 'inherit' });
  console.log('✅ Electron build completed\n');
} catch (error) {
  console.error('❌ Electron build failed:', error.message);
  process.exit(1);
}

// Show build results
console.log('🎉 Build completed successfully!');
console.log('\n📦 Distribution files created in dist-electron/');

try {
  const distFiles = fs.readdirSync('dist-electron');
  distFiles.forEach(file => {
    const filePath = path.join('dist-electron', file);
    const stats = fs.statSync(filePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   📄 ${file} (${sizeInMB} MB)`);
  });
} catch (error) {
  console.log('   Could not list distribution files');
}

console.log('\n🚀 Ready for distribution!');
console.log('   • Installer: BOQ Builder Setup *.exe');
console.log('   • Portable: BOQ-Builder-Portable-*.exe');
console.log('\n💡 The application will start with a clean database for new users.');