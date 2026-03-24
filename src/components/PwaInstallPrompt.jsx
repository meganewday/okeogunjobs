import { useState, useEffect } from 'react';
import './PwaInstallPrompt.css';

const PwaInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);

      const lastDismissed = localStorage.getItem('pwaInstallDismissed');
      const threeDays = 3 * 24 * 60 * 60 * 1000;

      if (!lastDismissed || (Date.now() - lastDismissed > threeDays)) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = () => {
    if (!installPrompt) {
      return;
    }
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA installation');
      } else {
        console.log('User dismissed the PWA installation');
      }
      setIsVisible(false);
      setInstallPrompt(null);
    });
  };

  const handleDismiss = () => {
    localStorage.setItem('pwaInstallDismissed', Date.now());
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="pwa-install-prompt">
      <div className="pwa-install-prompt-content">
        <p>Install Okeogunjobs for a better experience.</p>
        <div className="pwa-install-prompt-buttons">
          <button onClick={handleInstall} className="pwa-install-button">
            Install
          </button>
          <button onClick={handleDismiss} className="pwa-dismiss-button">
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallPrompt;
