import { registerSW } from 'virtual:pwa-register';

// This is the service worker registration function
export function registerServiceWorker() {
  const updateSW = registerSW({
    onNeedRefresh() {
      // Show a prompt to the user asking if they want to update
      if (confirm('New content available. Reload?')) {
        updateSW(true);
      }
    },
    onOfflineReady() {
      console.log('App ready to work offline');
      // You can show a notification to the user that the app is ready for offline use
      const offlineToast = document.createElement('div');
      offlineToast.className = 'offline-toast';
      offlineToast.textContent = 'App is ready for offline use';
      document.body.appendChild(offlineToast);
      
      // Remove the toast after 3 seconds
      setTimeout(() => {
        if (offlineToast.parentNode) {
          offlineToast.parentNode.removeChild(offlineToast);
        }
      }, 3000);
    },
  });
}