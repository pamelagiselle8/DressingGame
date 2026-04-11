import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMusic } from '../AudioContext';
import Grainient from '../components/Grainient';
import {
    HOME_IMAGE_PATH,
    COMPATIBILITY_MESSAGE_PATH_L,
    COMPATIBILITY_MESSAGE_PATH_M,
    COMPATIBILITY_MESSAGE_PATH_S,
    START_BUTTON_PATH,
    START_SOUND_PATH,
    INSTRUCCIONES_IMAGE_PATH,
    FLORES_IMAGE_PATH,
    CAMERA_ROLL_IMAGE_PATH,
} from '../config';

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
        <div style={{ width: '100%', height: '100%', position: 'absolute', zIndex: 0 }}>
                <Grainient
                    color1="#ffb2dd"
                    color2="#fed6f8"
                    color3="#fff9fc"
                    timeSpeed={1.5}
                    colorBalance={0}
                    warpStrength={1}
                    warpFrequency={5}
                    warpSpeed={3}
                    warpAmplitude={50}
                    blendAngle={0}
                    blendSoftness={0.05}
                    rotationAmount={500}
                    noiseScale={2}
                    grainAmount={0.1}
                    grainScale={2}
                    grainAnimated={false}
                    contrast={1.5}
                    gamma={1}
                    saturation={1}
                    centerX={0}
                    centerY={0}
                    zoom={0.9}
                />
            </div>
        <div className='relative lg:hidden block'>
        <img className='w-[90vw] max-w-[80vh]' 
        src={COMPATIBILITY_MESSAGE_PATH_L}
        srcSet={`${COMPATIBILITY_MESSAGE_PATH_S} 320w, ${COMPATIBILITY_MESSAGE_PATH_M} 768w, ${COMPATIBILITY_MESSAGE_PATH_L} 1024w`}
        alt='home' />
        </div>
      <div className='relative hidden lg:block'>
        <audio ref={audioRef} src={START_SOUND_PATH} />
        {/* <img 
        className='h-[40vw]'
        src={HOME_IMAGE_PATH}
        alt='home'
        /> */}
        <img 
        className='h-[40vw] z-20 relative -left-8'
        src={INSTRUCCIONES_IMAGE_PATH}
        alt='home'
        />
        <img 
        className='h-[13vw] absolute top-10 -right-12 z-0 animate-wobble'
        src={CAMERA_ROLL_IMAGE_PATH}
        alt='home'
        />
        <img 
        className='h-[25vw] absolute top-22 -right-30 z-0 animate-spin'
        src={FLORES_IMAGE_PATH}
        alt='home'
        style={{ animationDuration: '8s' }}
        />
        <img
          onClick={handleStart}
          className='absolute cursor-pointer hover:scale-105 active:scale-95 transition-transform z-20'
          src={START_BUTTON_PATH}
          alt='start'
          style={{ left: '14%', top: '84%', width: '14%' }}
        />
      </div>
    </div>
  );
}