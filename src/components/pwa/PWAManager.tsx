import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, RefreshCw, X, Share, CheckCircle2 } from 'lucide-react';

const INSTALL_DISMISS_KEY = 'hbs_pwa_install_dismissed';

/** Evento beforeinstallprompt (não tipado no lib.dom padrão). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/**
 * Gerencia a experiência de PWA, fora da árvore do dashboard (sempre tema claro):
 * - banner de "nova versão" (controla o reload do service worker);
 * - aviso "pronto para uso offline";
 * - convite de instalação (Android/desktop via beforeinstallprompt) + dica manual no iOS.
 */
export function PWAManager() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Checa atualização de hora em hora — apps instalados pegam novos deploys sem reabrir.
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
  });

  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(INSTALL_DISMISS_KEY) === '1' || isStandalone()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstallEvent(null);
      setShowIosHint(false);
      localStorage.setItem(INSTALL_DISMISS_KEY, '1');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    // iOS não dispara beforeinstallprompt → dica manual de "Adicionar à Tela de Início".
    if (isIos()) setShowIosHint(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // "Pronto offline" some sozinho após 5s.
  useEffect(() => {
    if (!offlineReady) return;
    const t = setTimeout(() => setOfflineReady(false), 5000);
    return () => clearTimeout(t);
  }, [offlineReady, setOfflineReady]);

  const dismissInstall = () => {
    setInstallEvent(null);
    setShowIosHint(false);
    localStorage.setItem(INSTALL_DISMISS_KEY, '1');
  };

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  const showInstall = !!installEvent;
  if (!needRefresh && !offlineReady && !showInstall && !showIosHint) return null;

  const cardClass =
    'pointer-events-auto w-full max-w-md rounded-xl bg-white shadow-card-hover border border-surface-border flex items-center gap-3 animate-slide-up';
  const iconWrap =
    'w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0';
  const primaryBtn =
    'text-xs font-semibold text-white bg-primary hover:bg-primary-light px-3 py-2 rounded-lg transition-colors flex-shrink-0';
  const closeBtn = 'text-neutral-400 hover:text-neutral-600 p-1 flex-shrink-0';

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-3 pointer-events-none"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      {/* Nova versão disponível */}
      {needRefresh && (
        <div className={`${cardClass} p-4`}>
          <div className={iconWrap}>
            <RefreshCw className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-800">Nova versão disponível</p>
            <p className="text-xs text-neutral-500">Atualize para ver as últimas melhorias.</p>
          </div>
          <button onClick={() => updateServiceWorker(true)} className={primaryBtn}>
            Atualizar
          </button>
          <button onClick={() => setNeedRefresh(false)} aria-label="Dispensar" className={closeBtn}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pronto para uso offline */}
      {offlineReady && !needRefresh && (
        <div className={`${cardClass} p-3`}>
          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
          <p className="flex-1 text-sm text-neutral-700">App pronto para uso offline.</p>
          <button onClick={() => setOfflineReady(false)} aria-label="Fechar" className={closeBtn}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Instalar (Android / desktop) */}
      {showInstall && (
        <div className={`${cardClass} p-4`}>
          <div className={iconWrap}>
            <Download className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-800">Instalar o HospedaBR</p>
            <p className="text-xs text-neutral-500">Acesso rápido, tela cheia e funciona como um app.</p>
          </div>
          <button onClick={handleInstall} className={primaryBtn}>
            Instalar
          </button>
          <button onClick={dismissInstall} aria-label="Dispensar" className={closeBtn}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dica de instalação no iOS */}
      {showIosHint && !showInstall && (
        <div className={`${cardClass} p-4`}>
          <div className={iconWrap}>
            <Share className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-xs text-neutral-600">
            Para instalar: toque em <span className="font-semibold">Compartilhar</span> e depois em{' '}
            <span className="font-semibold">“Adicionar à Tela de Início”</span>.
          </div>
          <button onClick={dismissInstall} aria-label="Dispensar" className={closeBtn}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
