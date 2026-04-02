import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonBackButton, IonButton, IonIcon,
  IonSpinner, IonInput, IonModal, IonLabel,
  useIonToast, IonRefresher, IonRefresherContent,
} from '@ionic/react';
import { addOutline, flameOutline, trashOutline, checkmarkOutline } from 'ionicons/icons';
import { useAuth } from '../hooks/useAuth';
import { useHabits } from '../hooks/useHabits';
import './Habits.css';

const EMOJI_OPTIONS = ['✅', '💧', '📖', '🏃', '🧘', '💪', '🥗', '😴', '📝', '🎯', '💊', '🚰', '🧹', '🎵', '🌿'];
const COLOR_OPTIONS = ['#22C55E', '#4F46E5', '#EF4444', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#14B8A6'];

const Habits = () => {
  const { user } = useAuth();
  const { habits, todayLogs, streaks, loading, todayCountFor, toggleHabit, createHabit, deleteHabit, refresh } = useHabits(user?.id);
  const [present] = useIonToast();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('✅');
  const [newColor, setNewColor] = useState('#22C55E');
  const [newTarget, setNewTarget] = useState(1);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) {
      present({ message: 'Inserisci un nome', duration: 2000, color: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await createHabit({ name: newName.trim(), emoji: newEmoji, color: newColor, target_per_day: newTarget });
      setShowAdd(false);
      setNewName('');
      setNewTarget(1);
      present({ message: 'Abitudine creata!', duration: 1500, color: 'success' });
    } catch {
      present({ message: 'Errore', duration: 2000, color: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteHabit(id);
      present({ message: 'Abitudine rimossa', duration: 1500, color: 'medium' });
    } catch {
      present({ message: 'Errore', duration: 2000, color: 'danger' });
    }
  };

  const handleToggle = async (habitId, target) => {
    try {
      await toggleHabit(habitId, target);
    } catch {
      present({ message: 'Errore', duration: 2000, color: 'danger' });
    }
  };

  const handleRefresh = async (e) => {
    await refresh();
    e.detail.complete();
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="habits-toolbar">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/dashboard" text="Indietro" />
          </IonButtons>
          <IonTitle>Abitudini</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowAdd(true)}>
              <IonIcon icon={addOutline} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="habits-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <motion.div className="habits-container"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {loading ? (
            <div className="habits-loading"><IonSpinner name="crescent" /></div>
          ) : habits.length === 0 ? (
            <div className="habits-empty">
              <span className="habits-empty-emoji">🌱</span>
              <p>Nessuna abitudine ancora</p>
              <IonButton size="small" shape="round" onClick={() => setShowAdd(true)}>
                <IonIcon icon={addOutline} slot="start" />
                Aggiungi
              </IonButton>
            </div>
          ) : (
            <div className="habits-list">
              {habits.map(h => {
                const count = todayCountFor(h.id);
                const target = h.target_per_day || 1;
                const done = count >= target;
                const streak = streaks[h.id] || 0;
                return (
                  <motion.div key={h.id} className={`habit-card ${done ? 'habit-done' : ''}`} style={{ '--habit-color': h.color }}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: habits.indexOf(h) * 0.06 }}
                    whileTap={{ scale: 0.97 }}>
                    <div className="habit-main" onClick={() => handleToggle(h.id, target)}>
                      <span className="habit-emoji">{h.emoji}</span>
                      <div className="habit-info">
                        <span className="habit-name">{h.name}</span>
                        <span className="habit-progress">
                          {count}/{target} {target > 1 ? 'volte' : 'volta'}
                        </span>
                      </div>
                      <div className="habit-check">
                        {done ? (
                          <div className="habit-check-done">
                            <IonIcon icon={checkmarkOutline} />
                          </div>
                        ) : (
                          <div className="habit-check-ring">
                            <svg viewBox="0 0 36 36">
                              <circle cx="18" cy="18" r="15.5" className="habit-ring-bg" />
                              <circle
                                cx="18" cy="18" r="15.5"
                                className="habit-ring-fill"
                                style={{
                                  strokeDasharray: `${(count / target) * 97.4} 97.4`,
                                  stroke: h.color,
                                }}
                              />
                            </svg>
                            <span className="habit-ring-text">{count}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="habit-footer">
                      {streak > 0 && (
                        <span className="habit-streak">
                          <IonIcon icon={flameOutline} /> {streak} giorni
                        </span>
                      )}
                      <button className="habit-delete" onClick={() => handleDelete(h.id)}>
                        <IonIcon icon={trashOutline} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Add Habit Modal */}
        <IonModal
          isOpen={showAdd}
          onDidDismiss={() => setShowAdd(false)}
          className="date-modal"
          breakpoints={[0, 0.65]}
          initialBreakpoint={0.65}
          handleBehavior="cycle"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Nuova Abitudine</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={handleAdd} disabled={saving} strong>
                  {saving ? <IonSpinner name="crescent" /> : 'Salva'}
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="add-habit-form">
              <IonLabel className="form-label">Nome</IonLabel>
              <IonInput
                value={newName}
                onIonInput={e => setNewName(e.detail.value || '')}
                placeholder="Es: Bere acqua"
                fill="outline"
                className="form-input"
              />

              <IonLabel className="form-label">Emoji</IonLabel>
              <div className="emoji-picker-grid">
                {EMOJI_OPTIONS.map(em => (
                  <button
                    key={em}
                    className={`emoji-pick ${newEmoji === em ? 'emoji-pick-sel' : ''}`}
                    onClick={() => setNewEmoji(em)}
                  >
                    {em}
                  </button>
                ))}
              </div>

              <IonLabel className="form-label">Colore</IonLabel>
              <div className="color-picker-row">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c}
                    className={`color-pick ${newColor === c ? 'color-pick-sel' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setNewColor(c)}
                  />
                ))}
              </div>

              <IonLabel className="form-label">Volte al giorno</IonLabel>
              <div className="target-picker">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    className={`target-btn ${newTarget === n ? 'target-btn-sel' : ''}`}
                    onClick={() => setNewTarget(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Habits;
