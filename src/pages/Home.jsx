import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';

export default function Home() {
  const navigate   = useNavigate();
  const audioRef   = useRef(null);

  function handleStart() {
    const audio = audioRef.current;
    if (!audio) { navigate('/game'); return; }

    audio.play();
    // navega cuando el audio termina
    audio.onended = () => navigate('/game');

    // fallback: si el audio dura más de 3s o falla, navega igual
    setTimeout(() => navigate('/game'), 500);
  }

  return (
    <div className='min-h-screen bg-[#fff9fc] flex justify-center items-center'>
      <div className='relative'>
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