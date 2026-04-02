import { useState, useEffect, useCallback } from 'react';
import { gamificationService } from '../services/gamificationService';

export function useGamification(userId) {
  const [xpData, setXpData] = useState({ total_xp: 0, level: 1, streak_days: 0, best_streak: 0 });
  const [badges, setBadges] = useState([]);
  const [levelInfo, setLevelInfo] = useState(gamificationService.LEVELS[0]);
  const [nextLevel, setNextLevel] = useState(gamificationService.LEVELS[1]);
  const [progress, setProgress] = useState(0);
  const [recentXP, setRecentXP] = useState([]);
  const [newBadges, setNewBadges] = useState([]);
  const [leveledUp, setLeveledUp] = useState(false);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [xp, userBadges, log] = await Promise.all([
        gamificationService.getUserXP(userId),
        gamificationService.getUserBadges(userId),
        gamificationService.getXPLog(userId, 10),
      ]);
      setXpData(xp);
      setBadges(userBadges);
      setRecentXP(log);
      setLevelInfo(gamificationService.getLevelForXP(xp.total_xp));
      setNextLevel(gamificationService.getNextLevel(xp.total_xp));
      setProgress(gamificationService.getProgressToNext(xp.total_xp));
    } catch (err) {
      console.error('Gamification load error:', err);
    }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);

  const awardXP = useCallback(async (amount, reason) => {
    if (!userId) return;
    const result = await gamificationService.addXP(userId, amount, reason);
    if (result.leveledUp) setLeveledUp(true);
    await loadData();
    return result;
  }, [userId, loadData]);

  const checkBadges = useCallback(async (context) => {
    if (!userId) return [];
    const awarded = await gamificationService.checkAndAwardBadges(userId, context);
    if (awarded.length > 0) {
      setNewBadges(awarded);
      await loadData();
    }
    return awarded;
  }, [userId, loadData]);

  const dismissLevelUp = () => setLeveledUp(false);
  const dismissNewBadges = () => setNewBadges([]);

  return {
    xp: xpData.total_xp,
    level: xpData.level,
    streakDays: xpData.streak_days,
    bestStreak: xpData.best_streak,
    levelInfo,
    nextLevel,
    progress,
    badges,
    recentXP,
    newBadges,
    leveledUp,
    awardXP,
    checkBadges,
    dismissLevelUp,
    dismissNewBadges,
    refresh: loadData,
    allBadges: gamificationService.BADGES,
    xpRewards: gamificationService.XP_REWARDS,
  };
}
