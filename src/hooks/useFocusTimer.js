import { useState, useEffect, useCallback, useRef } from 'react';
import { focusTimerService } from '../services/focusTimerService';

export function useFocusTimer(userId) {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [duration, setDuration] = useState(1500);
  const [sessionId, setSessionId] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [stats, setStats] = useState({ total: 0, totalMinutes: 0, todayCount: 0 });
  const intervalRef = useRef(null);

  const loadStats = useCallback(async () => {
    if (!userId) return;
    try {
      const s = await focusTimerService.getStats(userId);
      setStats(s);
    } catch { /* ignore */ }
  }, [userId]);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            // Complete session
            if (sessionId) {
              focusTimerService.completeSession(sessionId).then(() => loadStats());
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, sessionId, loadStats]);

  const start = async (tId = null, tTitle = '', dur = 1500) => {
    setDuration(dur);
    setTimeLeft(dur);
    setTaskId(tId);
    setTaskTitle(tTitle);
    try {
      const session = await focusTimerService.startSession(userId, tId, dur);
      setSessionId(session.id);
    } catch { /* ignore */ }
    setIsRunning(true);
  };

  const pause = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  };

  const resume = () => setIsRunning(true);

  const stop = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setTimeLeft(duration);
    setSessionId(null);
    setTaskId(null);
    setTaskTitle('');
  };

  const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

  return { isRunning, timeLeft, duration, progress, taskTitle, stats, start, pause, resume, stop };
}
