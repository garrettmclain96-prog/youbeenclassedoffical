'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { applyAction, initialState, parseBackup, restoreState, STORAGE_KEY } from '../lib/board-state.mjs';

const BoardContext = createContext(null);
export function BoardProvider({ children }) {
  const [state, setState] = useState(initialState);
  const current = useRef(state);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState(null);
  const notify = useCallback(message => setToast({ message, id: Date.now() }), []);
  const save = useCallback(data => {
    current.current = data; setState(data);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch { setStorageAvailable(false); }
  }, []);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const loaded = saved ? restoreState(saved) : initialState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
      current.current = loaded; setState(loaded);
    } catch { setStorageAvailable(false); }
    setReady(true);
    let dayTimer;
    const clock = () => { setNow(Date.now()); clearTimeout(dayTimer); dayTimer = setTimeout(clock, 86400000 - Date.now() % 86400000 + 30); };
    clock();
    const sync = e => { if (e.key === STORAGE_KEY) { const loaded = restoreState(e.newValue); current.current = loaded; setState(loaded); } };
    const visible = () => { if (!document.hidden) clock(); };
    window.addEventListener('storage', sync);
    window.addEventListener('focus', clock);
    document.addEventListener('visibilitychange', visible);
    return () => { clearTimeout(dayTimer); window.removeEventListener('storage', sync); window.removeEventListener('focus', clock); document.removeEventListener('visibilitychange', visible); };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  const act = useCallback(action => {
    const at = Date.now();
    const result = applyAction(current.current, { ...action, at });
    if (result.error) { notify(result.error); return false; }
    save(result.state);
    if (action.type !== 'draft') setNow(at);
    if (result.message) notify(result.message);
    return true;
  }, [notify, save]);
  const importBackup = useCallback(text => {
    const result = parseBackup(text);
    if (result.error) { notify(result.error); return false; }
    save(result.state); setNow(Date.now());
    notify('Backup restored on this device. Your clubhouse is ready.');
    return true;
  }, [notify, save]);
  return <BoardContext.Provider value={{ state, ready, now, storageAvailable, act, notify, importBackup, dialog, openDialog: setDialog, closeDialog: () => setDialog(null) }}>
    {children}
    <div className="toast-region" aria-live="polite" aria-atomic="true">{toast && <div className="toast" key={toast.id}><span className="toast-dot" />{toast.message}<button onClick={() => setToast(null)} aria-label="Dismiss notification">×</button></div>}</div>
  </BoardContext.Provider>;
}
export function useBoard() { return useContext(BoardContext); }
export function useClock() {
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  return now;
}
