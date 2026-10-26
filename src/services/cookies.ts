/**
 * Eklavya Cookie & Recent Messages Utility
 * Manages HTTP-style client cookies for:
 * 1. Recent Chat Messages & Queries (persisted in cookies as requested)
 * 2. Theme preference (dark/light)
 * 3. Recent study context
 */

export interface RecentMessageCookieItem {
  id: string;
  role: 'user' | 'mentor' | 'student';
  text: string;
  timestamp: string;
  subject?: string;
}

// 1. Generic Cookie Set/Get/Delete
export function setCookie(name: string, value: string, days = 30): void {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  const encoded = encodeURIComponent(value);
  document.cookie = `${name}=${encoded}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      } catch {
        return c.substring(nameEQ.length, c.length);
      }
    }
  }
  return null;
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

// 2. Recent Messages Cookie Storage (safely trimmed to fit ~3.5KB cookie limit)
const RECENT_CHAT_COOKIE = 'eklavya_recent_messages';
const LAST_QUERY_COOKIE = 'eklavya_last_query';
const THEME_COOKIE = 'eklavya_theme';

export function saveRecentMessagesToCookie(messages: RecentMessageCookieItem[]): void {
  try {
    // Keep the most recent 6 messages, trimmed to preserve room within 4KB cookie spec
    const recent = messages.slice(-6).map(m => ({
      id: m.id,
      role: m.role,
      // Trim very long outputs for the cookie snippet representation
      text: m.text.length > 300 ? m.text.substring(0, 300) + '...' : m.text,
      timestamp: m.timestamp,
      subject: m.subject
    }));
    setCookie(RECENT_CHAT_COOKIE, JSON.stringify(recent), 14);
  } catch (err) {
    console.warn('Could not serialize recent messages to cookie', err);
  }
}

export function getRecentMessagesFromCookie(): RecentMessageCookieItem[] {
  try {
    const raw = getCookie(RECENT_CHAT_COOKIE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveLastQueryCookie(query: string, subject: string): void {
  try {
    setCookie(LAST_QUERY_COOKIE, JSON.stringify({ query: query.trim(), subject, time: new Date().toISOString() }), 14);
  } catch {
    // ignore
  }
}

export function getLastQueryCookie(): { query: string; subject: string; time: string } | null {
  try {
    const raw = getCookie(LAST_QUERY_COOKIE);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

// 3. Theme Cookie Management
export function saveThemeCookie(theme: 'light' | 'dark'): void {
  setCookie(THEME_COOKIE, theme, 365);
}

export function getThemeCookie(): 'light' | 'dark' | null {
  const val = getCookie(THEME_COOKIE);
  if (val === 'dark' || val === 'light') return val;
  return null;
}
