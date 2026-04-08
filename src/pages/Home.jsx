import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMusic } from '../AudioContext';

export default function Home() {
  const navigate       = useNavigate();
  const { unlockAndPlay, fadeOut } = useMusic();
  const audioRef       = useRef(null);
  const [ready, setReady] = useState(false); // false = pantalla de bienvenida

  function handleAnyClick() {
    if (!ready) {
      unlockAndPlay();
      setReady(true);
      return;
    }
  }

  function handleStart() {
    fadeOut(600);
    const sfx = audioRef.current;
    if (sfx) {
      sfx.currentTime = 0;
      sfx.play().catch(() => {});
      sfx.onended = () => navigate('/game');
      setTimeout(() => navigate('/game'), 3000);
    } else {
      setTimeout(() => navigate('/game'), 650);
    }
  }

  if (!ready) {
    return (
      <div
        onClick={handleAnyClick}
        className='min-h-screen bg-[#fff9fc] flex flex-col items-center justify-center cursor-pointer gap-4'
      >
        <p className='text-pink-400 text-lg font-medium animate-pulse'>
          ✦ click anywhere to start ✦
        </p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#fff9fc] flex justify-center items-center'>
        <div className='relative lg:hidden block'>
        <img className='w-[90vw] max-w-[80vh]' src='src/assets/compatibility-message.png' alt='home' />
        </div>
      <div className='relative hidden lg:block'>
        <audio ref={audioRef} src='/src/assets/sound-effects/start.mp3' />
        <img className='h-[40vw]' src='src/assets/home.png' alt='home' />
        <img
          onClick={handleStart}
          className='absolute cursor-pointer hover:scale-105 active:scale-95 transition-transform'
          src='/src/assets/pixel-buttons/start-button.png'
          alt='start'
          style={{ left: '13%', top: '83.7%', width: '12%' }}
        />
      </div>
    </div>
  );
}