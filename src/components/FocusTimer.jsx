import React from 'react';
import { IonIcon, IonButton } from '@ionic/react';
import { playOutline, pauseOutline, stopOutline, closeOutline, timerOutline } from 'ionicons/icons';
import './FocusTimer.css';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const FocusTimer = ({ focusTimer, onClose }) => {
  const { isRunning, timeLeft, duration, progress, taskTitle, pause, resume, stop } = focusTimer;

  if (!isRunning && timeLeft === duration) return null;

  return (
    <div className="focus-timer-overlay">
      <div className="focus-timer-card">
        <button className="focus-timer-close" onClick={() => { stop(); onClose?.(); }}>
          <IonIcon icon={closeOutline} />
        </button>

        <div className="focus-timer-icon-wrap">
          <IonIcon icon={timerOutline} />
        </div>

        {taskTitle && <p className="focus-timer-task">{taskTitle}</p>}

        <div className="focus-timer-ring">
          <svg viewBox="0 0 120 120" className="focus-timer-svg">
            <circle cx="60" cy="60" r="52" className="focus-timer-bg-circle" />
            <circle
              cx="60" cy="60" r="52"
              className="focus-timer-fill-circle"
              style={{
                strokeDasharray: `${progress * 3.267} ${326.7 - progress * 3.267}`,
                strokeDashoffset: 81.675,
              }}
            />
          </svg>
          <span className="focus-timer-time">{formatTime(timeLeft)}</span>
        </div>

        <div className="focus-timer-controls">
          {isRunning ? (
            <IonButton shape="round" fill="outline" onClick={pause}>
              <IonIcon icon={pauseOutline} slot="icon-only" />
            </IonButton>
          ) : (
            <IonButton shape="round" onClick={resume} color="primary">
              <IonIcon icon={playOutline} slot="icon-only" />
            </IonButton>
          )}
          <IonButton shape="round" fill="outline" color="danger" onClick={() => { stop(); onClose?.(); }}>
            <IonIcon icon={stopOutline} slot="icon-only" />
          </IonButton>
        </div>

        {timeLeft === 0 && (
          <div className="focus-timer-complete">
            <span>Sessione completata!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FocusTimer;
