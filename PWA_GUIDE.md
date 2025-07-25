# Progressive Web App (PWA) Guide for D&D Journal

The D&D Journal now supports Progressive Web App (PWA) functionality, allowing users to install the app on their devices and use it like a native application.

## Features Implemented

### 1. Web App Manifest (`manifest.json`)
- Defines app metadata, icons, and display preferences
- Configures standalone display mode for app-like experience
- Specifies theme colors and orientation settings

### 2. Service Worker (`sw.js`)
- Enables offline functionality
- Caches essential app resources
- Provides network-first strategy for external resources
- Implements cache-first strategy for local resources

### 3. App Icons
- Complete set of icons in SVG format for all device sizes
- Scalable vector graphics ensure crisp display on all screen densities
- Custom D&D-themed design with book and d20 elements

### 4. iOS Safari Specific Features
- Apple Touch Icons for home screen installation
- Meta tags for web app capabilities
- Status bar styling configuration
- Full-screen app experience on iOS

## Installation Process

### On iOS (Safari)
1. Open the website in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Customize the name if desired
5. Tap "Add" to install

### On Android (Chrome)
1. Open the website in Chrome
2. Chrome will show an "Install" banner automatically
3. Or tap the three-dot menu → "Install app"
4. Confirm installation

### On Desktop (Chrome/Edge)
1. Open the website in a supported browser
2. Look for the install icon in the address bar
3. Or use the "Install D&D Journal" button in the app header
4. Follow the installation prompts

## Files Added/Modified

### New Files:
- `manifest.json` - Web app manifest
- `sw.js` - Service worker for offline functionality
- `js/pwa.js` - PWA install prompts and utilities
- `favicon.svg` - App favicon
- `favicon.ico` - Fallback favicon
- `icons/` directory with all app icons
- `scripts/generate-icons.js` - Icon generation script

### Modified Files:
- `index.html` - Added PWA meta tags and manifest links
- `character.html` - Added PWA meta tags and manifest links  
- `settings.html` - Added PWA meta tags and manifest links

## Technical Details

### Caching Strategy
- **Local Resources**: Cache-first with network fallback
- **External Resources**: Network-first with cache fallback
- **Navigation Requests**: Fallback to main app when offline

### Icon Specifications
- Supports all standard PWA icon sizes (72px to 512px)
- SVG format for scalability and small file sizes
- Maskable icons for adaptive icon support on Android

### Offline Support
- Core app functionality works offline
- Journal entries are stored locally
- External fonts and libraries cached after first load

## Browser Support

### Full PWA Support:
- Chrome (Android/Desktop)
- Edge (Desktop)
- Safari (iOS 11.3+)
- Firefox (limited install support)

### Features by Platform:
- **iOS**: Home screen installation, splash screen, status bar control
- **Android**: Full install prompts, adaptive icons, background sync
- **Desktop**: Window management, keyboard shortcuts, file handling

## Development Notes

### Testing PWA Features
1. Use Chrome DevTools → Application tab
2. Check Manifest and Service Worker sections
3. Test offline functionality in Network tab
4. Validate install prompts

### Icon Generation
Run `node scripts/generate-icons.js` to regenerate icons if needed.

### Service Worker Updates
The service worker automatically updates when the cache version changes. Increment `CACHE_NAME` in `sw.js` for forced updates.

## Best Practices Implemented

1. **Progressive Enhancement**: App works without PWA features
2. **Responsive Design**: Optimized for all screen sizes
3. **Fast Loading**: Critical resources cached immediately
4. **User Engagement**: Install prompts and success notifications
5. **Offline-First**: Core functionality available without network

## Future Enhancements

Potential improvements for enhanced PWA experience:
- Push notifications for reminders
- Background sync for multi-device data
- File system access for import/export
- Share target integration
- Shortcuts to specific app sections

## Troubleshooting

### Install Button Not Showing
- Check if app is already installed
- Verify HTTPS connection (required for PWA)
- Check browser console for service worker errors

### Icons Not Displaying
- Verify icon files exist in `/icons/` directory
- Check manifest.json syntax
- Clear browser cache and reload

### Offline Issues
- Check service worker registration in DevTools
- Verify cached resources in Application → Storage
- Check network fallback behavior