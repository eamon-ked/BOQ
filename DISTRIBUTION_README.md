# BOQ Builder - Distribution Build Guide

## Building the Executable

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Windows environment (for .exe builds)

### Build Commands

#### Full Distribution Build (Recommended)
```bash
npm run dist
```
This command will:
- Clean previous builds
- Build the React application
- Create Windows installer (.exe)
- Create portable executable
- Show build summary

#### Alternative Build Commands
```bash
# Windows installer only
npm run dist:win

# Portable executable only  
npm run dist:portable

# Clean build (no publishing)
npm run dist:clean
```

### Build Output

The distribution files will be created in the `dist-electron/` directory:

- **BOQ Builder Setup 1.1.2.exe** - Windows installer
- **BOQ-Builder-Portable-1.1.2.exe** - Portable executable

### Clean Database for Distribution

The application is configured to start with a clean database for new installations:

- ✅ No sample items included
- ✅ Only basic categories pre-loaded
- ✅ Users start with empty BOQ projects
- ✅ Database created in user's AppData folder

### Distribution Features

#### Installer Version
- Creates desktop shortcut
- Adds to Start Menu
- Proper uninstall support
- Auto-updater ready (if configured)

#### Portable Version
- No installation required
- Run from any location
- Database stored relative to executable
- Perfect for USB drives

### File Structure in Build

```
BOQ Builder/
├── main.js                 # Electron main process
├── dist/                   # React build output
├── server/                 # Backend API server
├── assets/                 # Icons and resources
└── node_modules/           # Dependencies
```

### Database Location

#### Installed Version
- Windows: `%APPDATA%/BOQ Builder/boq.db`

#### Portable Version  
- Same directory as executable: `./boq.db`

### Troubleshooting

#### Build Fails
1. Ensure all dependencies are installed: `npm install`
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check Node.js version: `node --version` (should be 18+)

#### Missing Icon
- Place `icon.ico` (256x256px) in `assets/` directory
- Rebuild with `npm run dist`

#### Database Issues
- Delete existing database file to reset
- Check file permissions in AppData folder

### Security Notes

- Code signing not configured (shows "Unknown Publisher")
- Windows Defender may flag as potentially unwanted
- Users may need to allow through Windows SmartScreen

### Customization

#### App Information
Edit `package.json` build section:
```json
{
  "build": {
    "appId": "com.yourcompany.boqbuilder",
    "productName": "Your BOQ Builder",
    "copyright": "Copyright © 2024 Your Company"
  }
}
```

#### Icon
Replace `assets/icon.ico` with your custom icon (256x256px recommended)

### Performance

The built application includes:
- ✅ Optimized React bundle
- ✅ SQLite database with indexes
- ✅ Lazy loading for components
- ✅ Performance monitoring (dev mode)
- ✅ Error tracking and reporting

### Support

For build issues or questions:
1. Check the console output for specific errors
2. Verify all dependencies are compatible
3. Test in development mode first: `npm run electron:dev`