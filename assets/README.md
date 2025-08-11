# Assets Directory

## Required Files for Distribution

### icon.ico
- **Size**: 256x256 pixels (recommended)
- **Format**: Windows ICO format
- **Purpose**: Application icon for Windows

You can create an icon using:
- Online tools like favicon.io or convertio.co
- Image editors like GIMP, Photoshop, or Paint.NET
- Icon-specific tools like IcoFX

### Creating an Icon

1. **Design**: Create a 256x256 pixel image with your logo/design
2. **Convert**: Save or convert to .ico format
3. **Replace**: Replace the placeholder `icon.ico` file
4. **Rebuild**: Run `npm run dist` to rebuild with new icon

### Default Icon

If no custom icon is provided, Electron will use its default icon.

### Additional Assets (Optional)

- **installerSplash.bmp**: Custom installer sidebar image
- **background.png**: Custom installer background
- **license.txt**: License text for installer