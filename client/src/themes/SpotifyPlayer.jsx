import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// Compact Spotify embed driven by the Spotify iFrame API. The embed loads with
// the page so that `start()` can play it straight from the click; playback jumps to `startAt` seconds and pauses at `stopAt` (if set).
//
// Browsers only let the embed make sound in response to a user gesture, so call
// start() from the click handler. Listeners who aren't logged in to Spotify in
// that browser get Spotify's 30 s preview instead of the full track; the preview
// plays as is (no jump to startAt).

let apiPromise;
function loadSpotifyApi() {
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      window.onSpotifyIframeApiReady = (api) => resolve(api);
      const s = document.createElement('script');
      s.src = 'https://open.spotify.com/embed/iframe-api/v1';
      s.async = true;
      document.body.appendChild(s);
    });
  }
  return apiPromise;
}

const SpotifyPlayer = forwardRef(function SpotifyPlayer({ uri, startAt = 0, stopAt, className, onPlayingChange }, ref) {
  const hostRef = useRef(null);
  const ctrlRef = useRef(null);
  const wantRef = useRef(false); // start() was called (maybe before the embed was ready)
  const seekedRef = useRef(false);
  const notify = useRef(onPlayingChange);
  notify.current = onPlayingChange;

  useEffect(() => {
    let dead = false;
    loadSpotifyApi().then((api) => {
      if (dead || !hostRef.current) return;
      const el = document.createElement('div');
      hostRef.current.appendChild(el);
      api.createController(el, { uri, width: '100%', height: 80 }, (ctrl) => {
        if (dead) return ctrl.destroy();
        ctrlRef.current = ctrl;
        // jump to startAt once playback is actually running
        ctrl.addListener('playback_update', (e) => {
          const d = e.data;
          const ended = d.duration > 0 && d.position >= d.duration - 250;
          notify.current?.(!d.isPaused && !ended);
          if (!wantRef.current || d.isPaused) return;
          if (stopAt && d.position >= stopAt * 1000) {
            wantRef.current = false;
            ctrl.pause();
            notify.current?.(false);
            return;
          }
          if (seekedRef.current) return;
          seekedRef.current = true;
          // Logged-out listeners only get a ~30 s preview clip: seeking into it
          // would cut it short, so jump only when the full track is playing.
          const fullTrack = d.duration > 35000;
          if (fullTrack && d.position < startAt * 1000 - 500) ctrl.seek(startAt);
        });
        if (wantRef.current) ctrl.play();
      });
    });
    return () => {
      dead = true;
      ctrlRef.current?.destroy();
      ctrlRef.current = null;
    };
  }, [uri, startAt, stopAt]);

  useImperativeHandle(ref, () => ({
    start() {
      wantRef.current = true;
      seekedRef.current = false;
      ctrlRef.current?.play();
    },
    stop() {
      wantRef.current = false;
      ctrlRef.current?.pause();
    },
    pause() {
      ctrlRef.current?.pause();
    },
    resume() {
      ctrlRef.current?.resume();
    },
  }));

  return <div ref={hostRef} className={className} />;
});

export default SpotifyPlayer;
