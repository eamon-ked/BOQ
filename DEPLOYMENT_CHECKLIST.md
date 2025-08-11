# BOQ Builder - Deployment Checklist

## Pre-Build Checklist

### ✅ Code Preparation
- [ ] All features tested and working
- [ ] No console errors in production build
- [ ] Dark mode working across all components
- [ ] Database starts clean (no sample data)
- [ ] Performance optimizations applied
- [ ] Error tracking configured

### ✅ Assets & Branding
- [ ] Custom icon.ico created (256x256px)
- [ ] App name and version updated in package.json
- [ ] Copyright information updated
- [ ] Publisher name set correctly

### ✅ Database Configuration
- [ ] Clean database initialization verified
- [ ] Only basic categories included
- [ ] No sample items in production build
- [ ] Database path configured for user directory

## Build Process

### ✅ Environment Setup
- [ ] Node.js 18+ installed
- [ ] All dependencies installed (`npm install`)
- [ ] Previous builds cleaned
- [ ] Windows build environment ready

### ✅ Build Execution
```bash
# Option 1: Use build script
npm run dist

# Option 2: Use batch file (Windows)
build-exe.bat

# Option 3: Manual steps
npm run build
npx electron-builder --win
```

### ✅ Build Verification
- [ ] React app builds without errors
- [ ] Electron packaging completes successfully
- [ ] Both installer and portable versions created
- [ ] File sizes reasonable (< 200MB typically)

## Post-Build Testing

### ✅ Installation Testing
- [ ] Installer runs without errors
- [ ] Desktop shortcut created
- [ ] Start menu entry added
- [ ] App launches successfully
- [ ] Database initializes correctly

### ✅ Functionality Testing
- [ ] All main features work
- [ ] Database operations function
- [ ] Import/export capabilities work
- [ ] Dark mode toggle works
- [ ] Keyboard shortcuts functional
- [ ] Performance dashboard accessible (dev mode)

### ✅ Portable Version Testing
- [ ] Portable exe runs without installation
- [ ] Database created in correct location
- [ ] All features work identically
- [ ] Can run from different directories

## Distribution Preparation

### ✅ File Organization
- [ ] Installer: `BOQ Builder Setup X.X.X.exe`
- [ ] Portable: `BOQ-Builder-Portable-X.X.X.exe`
- [ ] File sizes documented
- [ ] Checksums generated (optional)

### ✅ Documentation
- [ ] User manual updated
- [ ] Installation instructions prepared
- [ ] System requirements documented
- [ ] Troubleshooting guide ready

### ✅ Security Considerations
- [ ] Code signing certificate (if available)
- [ ] Virus scan completed
- [ ] Windows SmartScreen bypass instructions
- [ ] Firewall/antivirus whitelist instructions

## Release Checklist

### ✅ Version Management
- [ ] Version number incremented
- [ ] Changelog updated
- [ ] Git tags created
- [ ] Release notes prepared

### ✅ Distribution Channels
- [ ] Upload locations prepared
- [ ] Download links tested
- [ ] Mirror sites updated (if applicable)
- [ ] Update notifications configured

### ✅ Support Preparation
- [ ] Support documentation ready
- [ ] Known issues documented
- [ ] FAQ updated
- [ ] Contact information current

## Quality Assurance

### ✅ Cross-System Testing
- [ ] Windows 10 compatibility
- [ ] Windows 11 compatibility
- [ ] Different user permission levels
- [ ] Various screen resolutions
- [ ] Multiple monitor setups

### ✅ Performance Verification
- [ ] Startup time acceptable (< 5 seconds)
- [ ] Memory usage reasonable (< 200MB idle)
- [ ] Database operations fast
- [ ] UI responsive
- [ ] No memory leaks detected

### ✅ Edge Cases
- [ ] Network connectivity issues handled
- [ ] Disk space limitations handled
- [ ] Corrupted database recovery
- [ ] Large dataset performance
- [ ] Concurrent usage scenarios

## Final Steps

### ✅ Release Preparation
- [ ] All tests passed
- [ ] Documentation complete
- [ ] Distribution files ready
- [ ] Backup of source code created
- [ ] Release announcement prepared

### ✅ Post-Release
- [ ] Monitor for user feedback
- [ ] Track download statistics
- [ ] Monitor error reports
- [ ] Prepare for updates/patches
- [ ] Document lessons learned

## Build Commands Reference

```bash
# Full build with cleanup
npm run dist

# Windows installer only
npm run dist:win

# Portable version only
npm run dist:portable

# Development testing
npm run electron:dev

# Production preview
npm run electron:build
```

## Troubleshooting Common Issues

### Build Failures
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear build cache: `rm -rf dist dist-electron`
3. Update dependencies: `npm update`

### Runtime Issues
1. Check console for errors
2. Verify database permissions
3. Test with clean user profile
4. Check Windows compatibility mode

### Distribution Issues
1. Test on clean Windows installation
2. Verify all dependencies included
3. Check file associations
4. Test with different user privileges