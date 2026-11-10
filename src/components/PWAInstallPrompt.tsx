'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle2, MoreVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // default true until client checks storage
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed PWA)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) return;

    // Check if user dismissed recently (within 7 days)
    const dismissedAt = localStorage.getItem('likit_pwa_dismissed_at');
    if (dismissedAt) {
      const diffDays = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (diffDays < 7) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } else {
      setIsDismissed(false);
    }

    // Capture beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Capture appinstalled event
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    } else {
      // Browser didn't trigger prompt (or not Chrome/Edge), open step-by-step guide
      setShowGuideModal(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('likit_pwa_dismissed_at', Date.now().toString());
  };

  // Do not render anything if already installed as standalone
  if (isStandalone) return null;

  return (
    <>
      {/* Success Notification */}
      {installedSuccess && (
        <div className="pwa-success-toast" id="pwa-installed-toast">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>Likit telefonunuza yüklendi! Ana ekrandan açabilirsiniz.</span>
        </div>
      )}

      {/* Install Banner (Bottom Floating on Mobile & Desktop) */}
      {!isDismissed && (
        <div className="pwa-install-banner" id="pwa-install-banner">
          <div className="pwa-banner-left">
            <div className="pwa-banner-icon">
              <Smartphone size={22} className="text-indigo-400" />
            </div>
            <div className="pwa-banner-text">
              <div className="pwa-banner-title">Likit&apos;i Telefonuna Yükle</div>
              <div className="pwa-banner-desc">
                Ana ekrandan tek dokunuşla, tam ekran ve offline destekle kullanın.
              </div>
            </div>
          </div>

          <div className="pwa-banner-actions">
            <button
              id="btn-pwa-install"
              className="pwa-btn-install"
              onClick={handleInstallClick}
            >
              <Download size={16} />
              <span>Yükle</span>
            </button>
            <button
              id="btn-pwa-dismiss"
              className="pwa-btn-close"
              onClick={handleDismiss}
              aria-label="Kapat"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Guide Modal when beforeinstallprompt is not auto-available */}
      {showGuideModal && (
        <div className="modal-overlay" onClick={() => setShowGuideModal(false)}>
          <div className="modal pwa-guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Smartphone size={20} className="text-indigo-400" />
                <h3 className="modal-title">Likit&apos;i Ana Ekrana Ekleme</h3>
              </div>
              <button
                className="btn-modal-close"
                onClick={() => setShowGuideModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="pwa-guide-content">
              <p className="text-sm text-slate-300 mb-4">
                Android telefonunuzda Chrome veya Edge kullanıyorsanız birkaç saniyede ana ekrana ekleyebilirsiniz:
              </p>

              <div className="pwa-guide-steps">
                <div className="pwa-guide-step">
                  <div className="pwa-step-badge">1</div>
                  <div className="pwa-step-info">
                    <strong>Tarayıcı menüsünü açın</strong>
                    <p>Sağ üst köşedeki <MoreVertical size={14} className="inline mx-1" /> üç nokta menü simgesine dokunun.</p>
                  </div>
                </div>

                <div className="pwa-guide-step">
                  <div className="pwa-step-badge">2</div>
                  <div className="pwa-step-info">
                    <strong>&ldquo;Uygulamayı yükle&rdquo; seçeneğine dokunun</strong>
                    <p>Menüde &ldquo;Uygulamayı yükle&rdquo; veya &ldquo;Ana ekrana ekle&rdquo; satırını seçin.</p>
                  </div>
                </div>

                <div className="pwa-guide-step">
                  <div className="pwa-step-badge">3</div>
                  <div className="pwa-step-info">
                    <strong>Onaylayın ve kullanın</strong>
                    <p>Çıkan onay penceresinde &ldquo;Yükle&rdquo; butonuna basın. Likit ana ekranınızda bağımsız bir uygulama olarak belirecektir.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-primary w-full"
                onClick={() => setShowGuideModal(false)}
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
