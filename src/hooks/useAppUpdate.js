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
        // Download interno con progress tracking
        const response = await fetch(bustUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        const reader = response.body.getReader();
        const chunks = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (total > 0) {
            setDownloadProgress(Math.round((received / total) * 100));
          }
        }

        // Converti in base64 e salva con Filesystem
        const blob = new Blob(chunks, { type: 'application/vnd.android.package-archive' });
        const arrayBuffer = await blob.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < uint8.length; i += chunkSize) {
          binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
        }
        const base64Data = btoa(binary);

        const { Filesystem, Directory } = await import('@capacitor/filesystem');

        // Salva nella cartella cache dell'app
        const fileName = `TaskFlow-v${remoteVersion.versionName}.apk`;
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        setDownloadProgress(100);

        // Ottieni URI nativo per l'intent di installazione
        const fileUri = savedFile.uri;

        // Apri l'APK per l'installazione tramite intent Android
        try {
          // Usa il WebView per triggerare l'intent di installazione
          const intentUrl = `intent://${fileUri}#Intent;action=android.intent.action.VIEW;type=application/vnd.android.package-archive;end`;
          window.location.href = intentUrl;
        } catch {
          // Fallback: apri con Browser plugin
          try {
            const { Browser } = await import('@capacitor/browser');
            await Browser.open({ url: fileUri, windowName: '_system' });
          } catch {
            setError('APK scaricato. Apri il file manager per installare.');
          }
        }

        setDownloading(false);
      } catch (err) {
        setError(`Errore download: ${err.message}`);
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
