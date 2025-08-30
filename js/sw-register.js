// Service Worker Registration - Minimal and Versioned
import { VERSION_INFO } from './version.js';

const getVersionString = () => {
	// Use a stable version for cache naming; fall back to 'dev' locally
	if (!VERSION_INFO || VERSION_INFO.commit === 'dev') return 'dev';
	const run = VERSION_INFO.runNumber || '0';
	const short = VERSION_INFO.shortCommit || 'unknown';
	return `${run}-${short}`;
};

export const registerServiceWorker = () => {
	if (typeof window === 'undefined') return;
	if (!('serviceWorker' in navigator)) return;

	const version = getVersionString();
	const swUrl = `/sw.js?v=${encodeURIComponent(version)}`;

	navigator.serviceWorker.register(swUrl).catch(() => {
		// Silent fail to avoid impacting UX/tests
	});
};

// Auto-register on module load in browser
registerServiceWorker();

