import { useEffect, useRef, useState } from 'react';

// Animated gate scene: a still poster, an intro played once on open, then a
// seamless loop. `video` = { intro, loop, poster, openStill }; `className` is
// the theme's image class so the layers size/blend like its old <img> pair.
//
// Exactly one layer is visible at a time (themes may `screen`-blend layers, so
// stacking would double the light). A video only takes over once it fires
// 'playing', so the poster stays up while it loads — no blank flash. If
// playback is refused (e.g. iOS Low Power Mode blocks even muted autoplay)
// the open still is shown instead.
export default function SceneVideo({ video, isOpen, className, style }) {
  const introRef = useRef(null);
  const loopRef = useRef(null);
  const [introPlaying, setIntroPlaying] = useState(false);
  const [looping, setLooping] = useState(false);
  const [stillOnly, setStillOnly] = useState(false);

  useEffect(() => {
    const intro = introRef.current;
    const loop = loopRef.current;
    if (!intro || !loop) return;
    if (!isOpen) {
      intro.pause();
      loop.pause();
      intro.currentTime = 0;
      setIntroPlaying(false);
      setLooping(false);
      setStillOnly(false);
      return;
    }
    const showIntro = () => setIntroPlaying(true);
    const showLoop = () => setLooping(true);
    const toLoop = () => {
      loop.currentTime = 0;
      loop.play().catch(() => setStillOnly(true));
    };
    intro.addEventListener('playing', showIntro);
    intro.addEventListener('ended', toLoop);
    loop.addEventListener('playing', showLoop);
    intro.play().catch(() => setStillOnly(true));
    return () => {
      intro.removeEventListener('playing', showIntro);
      intro.removeEventListener('ended', toLoop);
      loop.removeEventListener('playing', showLoop);
    };
  }, [isOpen]);

  const layer = stillOnly ? 'still' : looping ? 'loop' : introPlaying ? 'intro' : 'poster';
  const cls = (name) => `${className} scene-layer ${layer === name ? 'on' : ''}`;

  return (
    <>
      <img className={cls('poster')} src={video.poster} alt="" style={style} />
      <video
        ref={introRef}
        className={cls('intro')}
        src={video.intro}
        muted
        playsInline
        preload="auto"
        style={style}
      />
      <video
        ref={loopRef}
        className={cls('loop')}
        src={video.loop}
        muted
        playsInline
        loop
        preload="auto"
        style={style}
      />
      {stillOnly && <img className={cls('still')} src={video.openStill} alt="" style={style} />}
    </>
  );
}
