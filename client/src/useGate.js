import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';

export const OPEN_COUNTDOWN = 20; // seconds of the "gate is opening" UX countdown

// States: loading | notfound | ready | sending | opening | success | limit | disabled | failed
export function useGate(token) {
  const [link, setLink] = useState(null);
  const [status, setStatus] = useState('loading');
  const [countdown, setCountdown] = useState(OPEN_COUNTDOWN);
  const [error, setError] = useState(''); // holds a translation key, not text
  const timerRef = useRef(null);

  useEffect(() => {
    let alive = true;
    api
      .getLink(token)
      .then((l) => {
        if (!alive) return;
        setLink(l);
        if (!l.active) setStatus('disabled');
        else if (l.remaining <= 0) setStatus('limit');
        else setStatus('ready');
      })
      .catch(() => alive && setStatus('notfound'));
    return () => {
      alive = false;
      clearInterval(timerRef.current);
    };
  }, [token]);

  const open = useCallback(async () => {
    if (status !== 'ready') return;
    setStatus('sending');
    setError('');
    try {
      const res = await api.openGate(token);
      setLink((prev) => ({ ...prev, ...res }));
      // success -> start the 20s countdown
      setCountdown(OPEN_COUNTDOWN);
      setStatus('opening');
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timerRef.current);
            setStatus('success');
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      if (err.data && typeof err.data.remaining === 'number') {
        setLink((prev) => ({ ...prev, ...err.data }));
      }
      if (err.status === 409) setStatus('limit');
      else if (err.status === 403) setStatus('disabled');
      else if (err.status === 502) {
        setError('err_gate_no_response');
        setStatus('ready');
      } else {
        setError('err_generic');
        setStatus('ready');
      }
    }
  }, [status, token]);

  return { link, status, countdown, error, open };
}
