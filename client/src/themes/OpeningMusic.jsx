import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import SpotifyPlayer from './SpotifyPlayer.jsx';

// Music for a theme's opening: an invisible Spotify player plus a small
// sound toggle in the corner (under the language switcher) while it plays.
// `track` = { uri, startAt, stopAt }. Call start() from the open click.
const OpeningMusic = forwardRef(function OpeningMusic({ track }, ref) {
  const player = useRef(null);
  const [started, setStarted] = useState(false); // the music was started by the click
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  useImperativeHandle(ref, () => ({
    start() {
      setStarted(true);
      setMuted(false);
      player.current?.start();
    },
    stop() {
      setStarted(false);
      player.current?.stop();
    },
  }));

  const toggle = () => {
    if (muted) player.current?.resume();
    else player.current?.pause();
    setMuted(!muted);
  };

  // show the toggle while the music plays, and keep it while it is paused by it
  const showToggle = started && (playing || muted);

  return (
    <>
      <SpotifyPlayer
        ref={player}
        uri={track.uri}
        startAt={track.startAt}
        stopAt={track.stopAt}
        className="opening-music"
        onPlayingChange={(p) => {
          setPlaying(p);
          if (p) setMuted(false);
        }}
      />
      {showToggle && (
        <button
          type="button"
          className="sound-toggle"
          onClick={toggle}
          aria-label={muted ? 'Sound on' : 'Sound off'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      )}
    </>
  );
});

export default OpeningMusic;
