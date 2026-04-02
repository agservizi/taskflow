import { useState, useEffect, useCallback } from 'react';

const VERSION_CHECK_URL = 'https://taskflow-woad-six.vercel.app/version.json';
const CHECK_INTERVAL = 3600000; // 1 ora

// Versione corrente dell'app - aggiornare ad ogni release
const APP_VERSION_CODE = 11;
const APP_VERSION_NAME = '4.3.0';

export function useAppUpdate() {
  const [currentVersion, setCurrentVersion] = useState(null);
  const [remoteVersion, setRemoteVersion] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  const isNative = () => !!window.Capacitor?.isNativePlatform?.();

  // Ottieni versione corrente
  const loadCurrentVersion = useCallback(async () => {
    setCurrentVersion({ versionName: APP_VERSION_NAME, versionCode: APP_VERSION_CODE });
  }, []);

  // Controlla aggiornamenti
  const checkForUpdate = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(`${VERSION_CHECK_URL}?_t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const remote = await res.json();
      setRemoteVersion(remote);

      const localCode = currentVersion?.versionCode || 0;
      if (remote.versionCode > localCode) {
        setUpdateAvailable(true);
        // Notifica locale su piattaforma nativa
        if (isNative()) {
          try {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            const perm = await LocalNotifications.requestPermissions?.();
            if (perm?.display === 'granted') {
              await LocalNotifications.schedule({
                notifications: [
                  {
                    title: 'Aggiornamento disponibile',
                    body: `TaskFlow v${remote.versionName} è disponibile. ${remote.releaseNotes || ''}`,
                    id: 9999,
                    schedule: { at: new Date(Date.now() + 1000) },
                  },
                ],
              });
            }
          } catch {
            // Notifiche non disponibili
          }
        }
      } else {
        setUpdateAvailable(false);
      }
      return remote;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setChecking(false);
    }
  }, [currentVersion]);

  // Scarica e installa APK
  const downloadAndInstall = useCallback(async () => {
    if (!remoteVersion?.apkUrl) {
      setError('URL APK non disponibile');
      return;
    }
    setDownloading(true);
    setDownloadProgress(0);
    setError(null);

    // Cache-busting: aggiungi versionCode all'URL
    const bustUrl = `${remoteVersion.apkUrl}?v=${remoteVersion.versionCode || Date.now()}`;

    if (isNative()) {
      try {
        // Su Android: apri l'URL nel browser di sistema
        // Il browser gestirà download + prompt di installazione APK
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: bustUrl, windowName: '_system' });
        setDownloadProgress(100);
        setDownloading(false);
      } catch {
        // Fallback: apri con window.open
        window.open(bustUrl, '_system');
        setDownloading(false);
      }
    } else {
      // Web: apri URL direttamente con cache-busting
      window.open(bustUrl, '_blank');
      setDownloading(false);
    }
  }, [remoteVersion]);

  // Carica versione corrente all'avvio
  useEffect(() => {
    loadCurrentVersion();
  }, [loadCurrentVersion]);

  // Auto-check all'avvio e ogni ora
  useEffect(() => {
    if (!currentVersion) return;

    // Check iniziale dopo 3 secondi
    const initialTimeout = setTimeout(() => {
      checkForUpdate();
    }, 3000);

    // Check periodico ogni ora
    const interval = setInterval(() => {
      checkForUpdate();
    }, CHECK_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [currentVersion, checkForUpdate]);

  return {
    currentVersion,
    remoteVersion,
    updateAvailable,
    downloading,
    downloadProgress,
    error,
    checking,
    checkForUpdate,
    downloadAndInstall,
    isNative: isNative(),
  };
}
