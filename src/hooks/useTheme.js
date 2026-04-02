import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'taskflow-theme';

// Calcola alba e tramonto approssimativi per la data e posizione
function getSunTimes(date, lat = 41.9, lng = 12.5) {
  // Algoritmo semplificato basato sul giorno dell'anno
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const dayOfYear = Math.floor(diff / 86400000);

  // Declinazione solare approssimata
  const declination = -23.45 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10));
  const decRad = (declination * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;

  // Angolo orario
  const cosH = -Math.tan(latRad) * Math.tan(decRad);
  const clampedCosH = Math.max(-1, Math.min(1, cosH));
  const hourAngle = (Math.acos(clampedCosH) * 180) / Math.PI;

  // Ore di luce
  const solarNoon = 12 - lng / 15; // approssimazione UTC
  const offset = -date.getTimezoneOffset() / 60;
  const noonLocal = solarNoon + offset;

  const sunriseHour = noonLocal - hourAngle / 15;
  const sunsetHour = noonLocal + hourAngle / 15;

  return { sunrise: sunriseHour, sunset: sunsetHour };
}

function isDaytime() {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;
  const { sunrise, sunset } = getSunTimes(now);
  return hours >= sunrise && hours < sunset;
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || 'system';
    } catch {
      return 'system';
    }
  });

  const applyTheme = useCallback((currentTheme) => {
    const root = document.documentElement;
    root.classList.remove('light-theme', 'dark-theme');

    if (currentTheme === 'light') {
      root.classList.add('light-theme');
    } else if (currentTheme === 'dark') {
      root.classList.add('dark-theme');
    } else {
      // system: usa alba/tramonto
      if (isDaytime()) {
        root.classList.add('light-theme');
      } else {
        root.classList.add('dark-theme');
      }
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // localStorage not available
    }

    // Se è "system", ricontrolla ogni minuto per alba/tramonto
    if (theme === 'system') {
      const interval = setInterval(() => applyTheme('system'), 60000);
      return () => clearInterval(interval);
    }
  }, [theme, applyTheme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  const isDark = () => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return !isDaytime();
  };

  return { theme, setTheme, isDark };
}
