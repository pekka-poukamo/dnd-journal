// PWA Install functionality
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = null;
        this.init();
    }

    init() {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('beforeinstallprompt fired');
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            this.deferredPrompt = e;
            // Show install button
            this.showInstallButton();
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', (evt) => {
            console.log('App was installed');
            this.hideInstallButton();
            // Show a welcome message or redirect
            this.showWelcomeMessage();
        });

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('App is running in standalone mode');
            this.hideInstallButton();
        }

        // Create install button if it doesn't exist
        this.createInstallButton();
    }

    createInstallButton() {
        // Check if button already exists
        if (document.getElementById('install-button')) {
            this.installButton = document.getElementById('install-button');
            return;
        }

        // Create install button
        this.installButton = document.createElement('button');
        this.installButton.id = 'install-button';
        this.installButton.className = 'install-button';
        this.installButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Install App
        `;
        this.installButton.style.display = 'none';
        
        // Add click handler
        this.installButton.addEventListener('click', () => {
            this.showInstallPrompt();
        });

        // Add to header
        const header = document.querySelector('header .header-nav');
        if (header) {
            header.appendChild(this.installButton);
        }

        // Add some basic styles
        this.addInstallButtonStyles();
    }

    addInstallButtonStyles() {
        if (document.getElementById('pwa-styles')) return;

        const style = document.createElement('style');
        style.id = 'pwa-styles';
        style.textContent = `
            .install-button {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                background: #2c3e50;
                color: white;
                border: none;
                border-radius: 0.25rem;
                cursor: pointer;
                font-size: 0.875rem;
                font-weight: 500;
                transition: background-color 0.2s ease;
                margin-left: auto;
            }

            .install-button:hover {
                background: #34495e;
            }

            .install-button svg {
                width: 16px;
                height: 16px;
            }

            .install-notification {
                position: fixed;
                top: 1rem;
                right: 1rem;
                background: #27ae60;
                color: white;
                padding: 1rem;
                border-radius: 0.5rem;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s ease;
            }

            .install-notification.show {
                opacity: 1;
                transform: translateX(0);
            }

            @media (max-width: 768px) {
                .install-button {
                    padding: 0.375rem 0.75rem;
                    font-size: 0.8rem;
                }

                .install-notification {
                    top: auto;
                    bottom: 1rem;
                    left: 1rem;
                    right: 1rem;
                    transform: translateY(100%);
                }

                .install-notification.show {
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    showInstallButton() {
        if (this.installButton) {
            this.installButton.style.display = 'flex';
        }
    }

    hideInstallButton() {
        if (this.installButton) {
            this.installButton.style.display = 'none';
        }
    }

    async showInstallPrompt() {
        if (!this.deferredPrompt) {
            console.log('No deferred prompt available');
            return;
        }

        // Show the install prompt
        this.deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        
        // Clear the deferred prompt
        this.deferredPrompt = null;
        this.hideInstallButton();
    }

    showWelcomeMessage() {
        const notification = document.createElement('div');
        notification.className = 'install-notification';
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
                <span>D&D Journal installed successfully!</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Check if PWA features are available
    static isSupported() {
        return 'serviceWorker' in navigator && 'PushManager' in window;
    }

    // Check if app is installed
    static isInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true;
    }
}

// Initialize PWA installer when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new PWAInstaller();
    });
} else {
    new PWAInstaller();
}

// Export for use in other modules
window.PWAInstaller = PWAInstaller;