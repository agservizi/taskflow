import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonAvatar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonModal,
  IonInput,
  IonTextarea,
  IonButtons,
  IonSpinner,
  useIonToast,
} from '@ionic/react';
import {
  logOutOutline,
  checkmarkCircleOutline,
  trendingUpOutline,
  mailOutline,
  sunnyOutline,
  moonOutline,
  createOutline,
  colorPaletteOutline,
  analyticsOutline,
  calendarOutline,
  flameOutline,
  documentTextOutline,
  downloadOutline,
  cloudUploadOutline,
  folderOutline,
  trophyOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { useTheme } from '../hooks/useTheme';
import { useProfile } from '../hooks/useProfile';
import VersionCheckCard from '../components/VersionCheckCard';
import { exportTasksToCSV, downloadCSV, parseCSV, csvRowsToTaskPayloads } from '../services/csvService';
import './Profile.css';

const emojiOptions = [
  '😊', '😎', '🚀', '💪', '🎯', '⚡', '🔥', '🌟',
  '🎨', '📱', '💻', '🏆', '👨‍💻', '👩‍💻', '🦊', '🐱',
  '🐶', '🦁', '🐻', '🐼', '🦄', '🌈', '🎵', '🎮',
];

const Profile = () => {
  const { user, signOut } = useAuth();
  const { stats, tasks, createTask } = useTasks(user?.id);
  const { theme, setTheme } = useTheme();
  const { displayName, avatarEmoji, bio, updateProfile } = useProfile(user?.id);
  const history = useHistory();
  const [present] = useIonToast();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const openEditModal = () => {
    setEditName(displayName || '');
    setEditBio(bio || '');
    setEditEmoji(avatarEmoji || '😊');
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      present({ message: 'Inserisci un nome', duration: 2000, color: 'warning' });
      return;
    }
    if (editName.trim().length < 2) {
      present({ message: 'Il nome deve avere almeno 2 caratteri', duration: 2000, color: 'warning' });
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        display_name: editName.trim(),
        bio: editBio.trim() || null,
        avatar_emoji: editEmoji,
      });
      present({ message: 'Profilo aggiornato!', duration: 1500, color: 'success' });
      setShowEditModal(false);
    } catch {
      present({ message: 'Errore nel salvataggio', duration: 2000, color: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const productivityLevel = () => {
    if (stats.total === 0) return { label: 'Principiante', emoji: '🌱' };
    const rate = stats.completed / stats.total;
    if (rate >= 0.8) return { label: 'Esperto', emoji: '🔥' };
    if (rate >= 0.5) return { label: 'Intermedio', emoji: '⚡' };
    return { label: 'In crescita', emoji: '🌿' };
  };

  const level = productivityLevel();
  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const shownName = displayName || user?.email?.split('@')[0] || 'Utente';

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="profile-toolbar">
          <IonTitle className="profile-title">Profilo</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="profile-content">
        <div className="profile-container">
          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper" onClick={openEditModal}>
              <IonAvatar className="profile-avatar">
                <div className="avatar-placeholder avatar-emoji">
                  {avatarEmoji}
                </div>
              </IonAvatar>
              <div className="avatar-edit-badge">
                <IonIcon icon={createOutline} />
              </div>
            </div>
            <h2 className="profile-name">{shownName}</h2>
            {bio && <p className="profile-bio">{bio}</p>}
            <p className="profile-email">
              <IonIcon icon={mailOutline} />
              {user?.email}
            </p>
            {!displayName && (
              <IonButton
                size="small"
                shape="round"
                fill="outline"
                className="setup-name-btn"
                onClick={openEditModal}
              >
                <IonIcon icon={createOutline} slot="start" />
                Imposta il tuo nome
              </IonButton>
            )}
          </div>

          {/* Stats Section */}
          <div className="profile-stats">
            <div className="profile-stat-card">
              <IonIcon icon={checkmarkCircleOutline} style={{ color: '#22C55E' }} />
              <span className="stat-number">{stats.completed}</span>
              <span className="stat-label">Completati</span>
            </div>
            <div className="profile-stat-card">
              <IonIcon icon={trendingUpOutline} style={{ color: '#4F46E5' }} />
              <span className="stat-number">{completionRate}%</span>
              <span className="stat-label">Completamento</span>
            </div>
            <div className="profile-stat-card">
              <span className="stat-emoji">{level.emoji}</span>
              <span className="stat-number-sm">{level.label}</span>
              <span className="stat-label">Livello</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="profile-progress-section">
            <div className="progress-header">
              <span>Produttività</span>
              <span className="progress-percent">{completionRate}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Info Cards */}
          <div className="profile-info">
            <div className="info-row">
              <span className="info-row-label">Task Totali</span>
              <span className="info-row-value">{stats.total}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label">In Ritardo</span>
              <span className="info-row-value" style={{ color: '#EF4444' }}>
                {stats.overdue}
              </span>
            </div>
            <div className="info-row">
              <span className="info-row-label">Da fare oggi</span>
              <span className="info-row-value">{stats.today}</span>
            </div>
          </div>

          {/* Shortcuts */}
          <div className="section-label">Strumenti</div>
          <div className="profile-shortcuts">
            <div className="shortcut-card" onClick={() => history.push('/projects')}>
              <IonIcon icon={folderOutline} className="shortcut-icon indigo" />
              <span className="shortcut-text">Progetti</span>
            </div>
            <div className="shortcut-card" onClick={() => history.push('/gamification')}>
              <IonIcon icon={trophyOutline} className="shortcut-icon gold" />
              <span className="shortcut-text">Gamification</span>
            </div>
            <div className="shortcut-card" onClick={() => history.push('/tabs/calendar')}>
              <IonIcon icon={calendarOutline} className="shortcut-icon blue" />
              <span className="shortcut-text">Calendario</span>
            </div>
            <div className="shortcut-card" onClick={() => history.push('/tabs/habits')}>
              <IonIcon icon={flameOutline} className="shortcut-icon green" />
              <span className="shortcut-text">Abitudini</span>
            </div>
            <div className="shortcut-card" onClick={() => history.push('/tabs/templates')}>
              <IonIcon icon={documentTextOutline} className="shortcut-icon purple" />
              <span className="shortcut-text">Template</span>
            </div>
            <div className="shortcut-card" onClick={() => history.push('/tabs/analytics')}>
              <IonIcon icon={analyticsOutline} className="shortcut-icon blue" />
              <span className="shortcut-text">Analytics</span>
            </div>
            <div className="shortcut-card" onClick={() => history.push('/tabs/categories')}>
              <IonIcon icon={colorPaletteOutline} className="shortcut-icon orange" />
              <span className="shortcut-text">Categorie</span>
            </div>
          </div>

          {/* Import / Export */}
          <div className="section-label">Dati</div>
          <div className="profile-data-actions">
            <IonButton expand="block" fill="outline" shape="round" onClick={() => {
              const csv = exportTasksToCSV(tasks);
              downloadCSV(csv);
              present({ message: 'CSV esportato!', duration: 1500, color: 'success' });
            }}>
              <IonIcon icon={downloadOutline} slot="start" />
              Esporta Task (CSV)
            </IonButton>
            <IonButton expand="block" fill="outline" shape="round" onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.csv';
              input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                setImporting(true);
                try {
                  const text = await file.text();
                  const rows = parseCSV(text);
                  const payloads = csvRowsToTaskPayloads(rows, user.id);
                  for (const p of payloads) await createTask(p);
                  present({ message: `${payloads.length} task importati!`, duration: 2000, color: 'success' });
                } catch { present({ message: 'Errore importazione', duration: 2000, color: 'danger' }); }
                finally { setImporting(false); }
              };
              input.click();
            }} disabled={importing}>
              <IonIcon icon={cloudUploadOutline} slot="start" />
              {importing ? 'Importando...' : 'Importa Task (CSV)'}
            </IonButton>
          </div>

          {/* Theme Toggle */}
          <div className="section-label">Aspetto</div>
          <div className="theme-card">
            <IonSegment
              value={theme}
              onIonChange={(e) => setTheme(e.detail.value)}
              className="theme-segment"
            >
              <IonSegmentButton value="light">
                <IonIcon icon={sunnyOutline} />
                <IonLabel>Chiaro</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="system">
                <IonIcon icon={sunnyOutline} />
                <IonLabel>Alba/Tram.</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="dark">
                <IonIcon icon={moonOutline} />
                <IonLabel>Scuro</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>

          {/* Version Check */}
          <div className="section-label">Impostazioni</div>
          <VersionCheckCard />

          {/* Logout */}
          <IonButton
            expand="block"
            shape="round"
            color="danger"
            fill="outline"
            className="logout-btn"
            onClick={signOut}
          >
            <IonIcon icon={logOutOutline} slot="start" />
            Esci dall'account
          </IonButton>
        </div>

        {/* Edit Profile Modal */}
        <IonModal
          isOpen={showEditModal}
          onDidDismiss={() => setShowEditModal(false)}
          className="date-modal"
          breakpoints={[0, 0.75, 1]}
          initialBreakpoint={0.75}
          handleBehavior="cycle"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Modifica Profilo</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={handleSaveProfile} disabled={saving} strong>
                  {saving ? <IonSpinner name="crescent" /> : 'Salva'}
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {/* Avatar Emoji Picker */}
            <div className="edit-avatar-section">
              <div className="edit-avatar-preview">{editEmoji}</div>
              <span className="edit-avatar-label">Scegli il tuo avatar</span>
              <div className="emoji-grid">
                {emojiOptions.map((em) => (
                  <button
                    key={em}
                    className={`emoji-option ${editEmoji === em ? 'emoji-selected' : ''}`}
                    onClick={() => setEditEmoji(em)}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="edit-field">
              <IonLabel className="edit-field-label">Nome visualizzato *</IonLabel>
              <IonInput
                value={editName}
                onIonInput={(e) => setEditName(e.detail.value)}
                placeholder="Il tuo nome"
                fill="outline"
                className="edit-input"
                maxlength={40}
              />
            </div>

            {/* Bio */}
            <div className="edit-field">
              <IonLabel className="edit-field-label">Bio</IonLabel>
              <IonTextarea
                value={editBio}
                onIonInput={(e) => setEditBio(e.detail.value)}
                placeholder="Scrivi qualcosa su di te..."
                fill="outline"
                className="edit-textarea"
                autoGrow
                rows={3}
                maxlength={150}
              />
              <span className="char-count">{(editBio || '').length}/150</span>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
