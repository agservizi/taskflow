import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonProgressBar,
} from '@ionic/react';
import {
  cloudDownloadOutline,
  checkmarkCircleOutline,
  refreshOutline,
  alertCircleOutline,
  phonePortraitOutline,
  reloadOutline,
} from 'ionicons/icons';
import { useAppUpdate } from '../hooks/useAppUpdate';
import './VersionCheckCard.css';

const VersionCheckCard = () => {
  const {
    currentVersion,
    remoteVersion,
    updateAvailable,
    downloading,
    downloadProgress,
    error,
    checking,
    checkForUpdate,
    downloadAndInstall,
    isNative,
  } = useAppUpdate();

  // Controlla e se trova update scarica subito
  const checkAndAutoInstall = async () => {
    const remote = await checkForUpdate();
    if (remote && remote.versionCode > (currentVersion?.versionCode || 0)) {
      // Avvia download automaticamente
      setTimeout(() => downloadAndInstall(), 300);
    }
  };

  return (
    <IonCard className="version-card">
      <IonCardContent className="version-card-content">
        {/* Header */}
        <div className="version-header">
          <div className="version-icon-wrap">
            <IonIcon icon={phonePortraitOutline} />
          </div>
          <div className="version-info">
            <h3 className="version-title">Versione App</h3>
            <span className="version-number">
              v{currentVersion?.versionName || '...'}{' '}
              <span className="version-code">(build {currentVersion?.versionCode || '?'})</span>
            </span>
          </div>
        </div>

        {/* Update Banner */}
        {updateAvailable && !downloading && (
          <div className="update-banner">
            <div className="update-banner-content">
              <IonIcon icon={cloudDownloadOutline} className="update-icon" />
              <div>
                <strong>Aggiornamento disponibile!</strong>
                <p>v{remoteVersion?.versionName} (build {remoteVersion?.versionCode})</p>
                {remoteVersion?.releaseNotes && (
                  <p className="release-notes">{remoteVersion.releaseNotes}</p>
                )}
              </div>
            </div>
            {isNative ? (
              <IonButton
                expand="block"
                shape="round"
                className="download-btn"
                onClick={downloadAndInstall}
              >
                <IonIcon icon={cloudDownloadOutline} slot="start" />
                Scarica e installa v{remoteVersion?.versionName}
              </IonButton>
            ) : (
              <IonButton
                expand="block"
                shape="round"
                className="download-btn"
                onClick={() => window.location.reload()}
              >
                <IonIcon icon={reloadOutline} slot="start" />
                Ricarica app web
              </IonButton>
            )}
          </div>
        )}

        {/* Download Progress */}
        {downloading && (
          <div className="download-progress">
            <div className="progress-info">
              <IonSpinner name="crescent" className="progress-spinner" />
              <span>Download in corso... {downloadProgress}%</span>
            </div>
            <IonProgressBar
              value={downloadProgress / 100}
              className="progress-bar"
            />
          </div>
        )}

        {/* Error */}
        {error && !downloading && (
          <div className="update-error">
            <IonIcon icon={alertCircleOutline} />
            <span>{error}</span>
            <IonButton
              fill="clear"
              size="small"
              onClick={checkForUpdate}
            >
              Riprova
            </IonButton>
          </div>
        )}

        {/* No Update */}
        {!updateAvailable && !error && !checking && currentVersion && (
          <div className="up-to-date">
            <IonIcon icon={checkmarkCircleOutline} />
            <span>App aggiornata</span>
          </div>
        )}

        {/* Check Button */}
        <IonButton
          expand="block"
          fill="outline"
          shape="round"
          className="check-btn"
          onClick={checkAndAutoInstall}
          disabled={checking || downloading}
        >
          {checking ? (
            <IonSpinner name="crescent" />
          ) : (
            <>
              <IonIcon icon={refreshOutline} slot="start" />
              Verifica aggiornamenti
            </>
          )}
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
};

export default VersionCheckCard;
