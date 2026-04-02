import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonBackButton, IonProgressBar, IonBadge,
  IonRefresher, IonRefresherContent, IonSkeletonText, IonIcon,
} from '@ionic/react';
import {
  trophyOutline, flameOutline, starOutline, ribbonOutline,
  rocketOutline, arrowUpOutline,
} from 'ionicons/icons';
import { useAuth } from '../hooks/useAuth';
import { useGamification } from '../hooks/useGamification';
import './Gamification.css';

const BADGE_ICONS = {
  first_task: '✅', ten_tasks: '🔟', fifty_tasks: '🏅', hundred_tasks: '💯',
  streak_7: '🔥', streak_30: '🌋', focus_master: '🧘', early_bird: '🌅',
  night_owl: '🦉', all_done: '🎯', first_project: '📁', habit_7: '💪',
  habit_30: '🏆', speed_demon: '⚡', organizer: '🗂️',
};
const BADGE_LABELS = {
  first_task: 'Primo Task', ten_tasks: '10 Task', fifty_tasks: '50 Task', hundred_tasks: '100 Task',
  streak_7: 'Streak 7gg', streak_30: 'Streak 30gg', focus_master: 'Focus Master',
  early_bird: 'Mattiniero', night_owl: 'Nottambulo', all_done: 'Tutto Fatto',
  first_project: 'Primo Progetto', habit_7: 'Abitudine 7gg', habit_30: 'Abitudine 30gg',
  speed_demon: 'Velocista', organizer: 'Organizzatore',
};
const ALL_BADGES = Object.keys(BADGE_ICONS);

const Gamification = () => {
  const { user } = useAuth();
  const { xp, level, streakDays, bestStreak, levelInfo, nextLevel, progress, badges, recentXP, loading } = useGamification(user?.id);

  const earnedBadgeKeys = useMemo(() => new Set(badges.map(b => b.badge_key)), [badges]);

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/tabs/dashboard" text="Indietro" /></IonButtons>
          <IonTitle>Gamification</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="gamification-content">
        <IonRefresher slot="fixed" onIonRefresh={async (e) => { e.detail.complete(); }}>
          <IonRefresherContent />
        </IonRefresher>

        <motion.div className="gam-container"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {loading ? (
            [1,2,3].map(i => <IonSkeletonText key={i} animated style={{ height: 80, borderRadius: 16, marginBottom: 12 }} />)
          ) : (
            <>
              {/* Level Card */}
              <motion.div className="gam-level-card"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div className="gam-level-ring">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" className="ring-bg" />
                    <circle cx="50" cy="50" r="42" className="ring-fill"
                      style={{ strokeDasharray: `${(progress || 0) * 2.639} 263.9`, strokeDashoffset: 65.97 }} />
                  </svg>
                  <span className="ring-level">{level}</span>
                </div>
                <div className="gam-level-info">
                  <h2>{levelInfo?.title || 'Principiante'}</h2>
                  <div className="gam-xp-row">
                    <IonIcon icon={starOutline} />
                    <span>{xp} XP</span>
                    {nextLevel && <span className="gam-next">/ {nextLevel.xp} per Lvl {level + 1}</span>}
                  </div>
                  <IonProgressBar value={progress / 100} color="primary" className="gam-bar" />
                </div>
              </motion.div>

              {/* Streak */}
              <motion.div className="gam-streak-card"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
                <div className="gam-streak-icon">
                  <IonIcon icon={flameOutline} />
                </div>
                <div className="gam-streak-info">
                  <h3>Streak Attuale</h3>
                  <div className="gam-streak-numbers">
                    <div className="streak-num">
                      <strong>{streakDays}</strong>
                      <span>giorni</span>
                    </div>
                    <div className="streak-divider" />
                    <div className="streak-num">
                      <strong>{bestStreak}</strong>
                      <span>migliore</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Badges */}
              <h3 className="gam-section-title">
                <IonIcon icon={ribbonOutline} /> Badge
                <IonBadge color="medium">{badges.length}/{ALL_BADGES.length}</IonBadge>
              </h3>
              <div className="gam-badges-grid">
                {ALL_BADGES.map(key => {
                  const earned = earnedBadgeKeys.has(key);
                  return (
                    <motion.div key={key} className={`gam-badge ${earned ? 'earned' : 'locked'}`}
                      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.25, delay: ALL_BADGES.indexOf(key) * 0.03 }}
                      whileTap={{ scale: 0.93 }}>
                      <span className="gam-badge-icon">{BADGE_ICONS[key]}</span>
                      <span className="gam-badge-label">{BADGE_LABELS[key]}</span>
                      {earned && <IonIcon icon={trophyOutline} className="gam-badge-check" />}
                    </motion.div>
                  );
                })}
              </div>

              {/* Recent XP */}
              {recentXP.length > 0 && (
                <>
                  <h3 className="gam-section-title">
                    <IonIcon icon={arrowUpOutline} /> XP Recenti
                  </h3>
                  <div className="gam-xp-log">
                    {recentXP.slice(0, 15).map(entry => (
                      <div key={entry.id} className="gam-xp-entry">
                        <div className="xp-entry-left">
                          <IonBadge color="primary">+{entry.amount}</IonBadge>
                          <span>{entry.action.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="xp-entry-date">
                          {new Date(entry.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </motion.div>
      </IonContent>
    </IonPage>
  );
};

export default Gamification;
