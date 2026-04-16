import { assetLibrary } from '../assets';
import OutfitCanvas from './OutfitCanvas';
import {
  BACKGROUND_WINDOW_PATH,
  NEXT_BUTTON_PATH,
  BACK_BUTTON_PATH,
  PIC_INSTRUCTIONS_IMAGE_PATH,
} from '../config';
import TargetCursor from './TargetCursor';
import { useState } from 'react';

export default function BackgroundStage({ currentIndices, backgroundIndex, onEdit, onSave }) {
  const bgUrl = assetLibrary.get('background', backgroundIndex);
  const [cameraMode, setCameraMode] = useState('');
  const [flashing, setFlashing] = useState(false);
  const isTargetMode = cameraMode === 'cursor-target';

  async function handleSave() {
    // flash
    setFlashing(true);
    setTimeout(() => setFlashing(false), 900);
    onSave();
    setCameraMode('');
  }

  return (
    <div
      className="relative w-[380px] h-[380px] rounded-xl overflow-visible"
    >
      {isTargetMode && <TargetCursor
        spinDuration={2}
        hideDefaultCursor
        parallaxOn
        hoverDuration={0.2}
      />}

      {/* Modo captura: personaje centrado y ampliado con transicion suave */}
      <div
        className={
          'fixed inset-0 z-40 flex flex-col gap-10 items-center justify-center -mt-20 transition-all duration-500 ease-out ' +
          (isTargetMode
            ? 'opacity-100 pointer-events-auto bg-[radial-gradient(circle_at_20%_20%,#ffb2dd_0%,#fed6f8_45%,#fff9fc_100%)]'
            : 'opacity-0 pointer-events-none bg-transparent')
        }
      >
        <img src={PIC_INSTRUCTIONS_IMAGE_PATH} alt='capture instructions' className='w-90 pointer-events-none' />
        <div
          className={
            'cursor-target relative w-[380px] h-[380px] rounded-xl transition-all duration-500 ease-out ' +
            (isTargetMode ? 'scale-100 translate-y-0' : 'scale-75 translate-y-8')
          }
          onClick={isTargetMode ? handleSave : undefined}
        >
          {bgUrl && (
            <img
              src={bgUrl}
              alt='selected background'
              className='absolute inset-0 w-[94%] h-[86%] mt-10 ml-2 object-cover rounded-xl'
              style={{ zIndex: 0 }}
            />
          )}
          <OutfitCanvas currentIndices={currentIndices} className='absolute inset-0 h-[230px] translate-y-1/3 z-10' />
          <img
            src={BACKGROUND_WINDOW_PATH}
            alt='background window frame'
            className='absolute inset-0 w-full h-full object-contain pointer-events-none z-20'
          />
        </div>
      </div>

      {/* flash overlay */}
      {flashing && (
        <div className='fixed inset-0 bg-white z-50 pointer-events-none animate-pulse' />
      )}
      {/* Fondo */}
      {!isTargetMode && bgUrl && (
        <img
          src={bgUrl}
          alt="background"
          className="absolute inset-0 w-[94%] h-[86%] mt-10 ml-2 object-cover rounded-xl"
          style={{ zIndex: 0 }}
        />
      )}

      {!isTargetMode && (
        <img
          src={BACKGROUND_WINDOW_PATH}
          alt="background window frame"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
      )}

      {/* Outfit encima del fondo */}
      {!isTargetMode && (
        <OutfitCanvas currentIndices={currentIndices} className="absolute inset-0 h-[230px] translate-y-1/3" />
      )}

      {/* Botones */}
      {!isTargetMode &&
        <div className="absolute bottom-5 flex gap-6 translate-x-1/5 z-20">
          <img
            className='cursor-pointer hover:scale-105 active:scale-95 transition-transform'
            style={{ top: 325, left: 0, width: 122, height: 34, zIndex: 100 }}
            src={BACK_BUTTON_PATH} alt='edit outfit'
            onClick={onEdit}
          />
          <img
            className='cursor-pointer hover:scale-105 active:scale-95 transition-transform'
            style={{ top: 325, left: 0, width: 122, height: 34, zIndex: 100 }}
            src={NEXT_BUTTON_PATH} alt='confirm outfit'
            onClick={() => { setCameraMode('cursor-target') }}
          />
        </div>}
    </div>
  );
}