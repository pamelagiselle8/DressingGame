import { createContext, useContext, useRef } from 'react';

const MusicContext = createContext(null);

export function MusicProvider({ children }) {
  const bgmRef = useRef(null);

  function unlockAndPlay(restart = true) {
    const audio = bgmRef.current;
    if (!audio) return;
    if (restart) audio.currentTime = 0;
    audio.volume = 0.5;
    audio.loop   = true;
    audio.play().catch(() => {});
  }

  function stopMusic() {
    const audio = bgmRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  function fadeOut(duration = 800) {
    const audio = bgmRef.current;
    if (!audio) return;
    const step   = audio.volume / (duration / 50);
    const ticker = setInterval(() => {
      if (audio.volume > step) {
        audio.volume -= step;
      } else {
        audio.volume = 0;
        audio.pause();
        audio.currentTime = 0;
        clearInterval(ticker);
      }
    }, 50);
  }

  return (
    <MusicContext.Provider value={{ unlockAndPlay, stopMusic, fadeOut }}>
      <audio ref={bgmRef} src='/src/assets/sound-effects/background-music.mp3' />
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  return useContext(MusicContext);
}