import { useState, useEffect, useCallback, useRef } from 'react';

const CACHE_PREFIX = 'taskflow_cache_';
const QUEUE_KEY = 'taskflow_offline_queue';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState([]);
  const syncingRef = useRef(false);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); processQueue(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    loadQueue();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadQueue = () => {
    try {
      const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      setPendingActions(q);
    } catch { setPendingActions([]); }
  };

  const saveQueue = (queue) => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    setPendingActions(queue);
  };

  // Cache data locally
  const cacheData = useCallback((key, data) => {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch { /* storage full */ }
  }, []);

  // Get cached data
  const getCachedData = useCallback((key, maxAge = 3600000) => {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp > maxAge) return null;
      return data;
    } catch { return null; }
  }, []);

  // Queue an action for later sync
  const queueAction = useCallback((action) => {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    queue.push({ ...action, id: Date.now() + Math.random(), queuedAt: new Date().toISOString() });
    saveQueue(queue);
  }, []);

  // Process queued actions when back online
  const processQueue = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    try {
      const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      if (!queue.length) return;

      const failed = [];
      for (const action of queue) {
        try {
          if (action.handler && typeof window[action.handler] === 'function') {
            await window[action.handler](action.payload);
          }
        } catch {
          failed.push(action);
        }
      }
      saveQueue(failed);
    } finally {
      syncingRef.current = false;
    }
  }, []);

  // Clear all cache
  const clearCache = useCallback(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  }, []);

  return {
    isOnline,
    pendingActions,
    cacheData,
    getCachedData,
    queueAction,
    processQueue,
    clearCache,
    hasPending: pendingActions.length > 0,
  };
}
