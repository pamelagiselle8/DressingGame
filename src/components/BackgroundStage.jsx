import { assetLibrary } from '../assets';
import OutfitCanvas from './OutfitCanvas';
import {
  BACKGROUND_WINDOW_PATH,
  NEXT_BUTTON_PATH,
  BACK_BUTTON_PATH,
} from '../config';
import TargetCursor from './TargetCursor';
import { useState } from 'react';

export default function BackgroundStage({ currentIndices, backgroundIndex, onEdit, onSave }) {
  const bgUrl = assetLibrary.get('background', backgroundIndex);
  const [cameraMode, setCameraMode] = useState('');
  const [flashing, setFlashing] = useState(false);

  async function handleSave() {
    // flash
    setFlashing(true);
    setTimeout(() => setFlashing(false), 600);
    onSave();
    setCameraMode('');
  }

  return (
    <div
      className={"relative w-[380px] h-[380px] rounded-xl " + cameraMode}
      onClick={cameraMode === 'cursor-target' ? handleSave : () => { }}
    >
      {cameraMode === 'cursor-target' && <TargetCursor
        spinDuration={2}
        hideDefaultCursor
        parallaxOn
        hoverDuration={0.2}
      />}
      {/* flash overlay */}
      {flashing && (
        <div className='fixed inset-0 bg-white z-50 pointer-events-none animate-pulse' />
      )}
      {/* Fondo */}
      {bgUrl && (
        <img
          src={bgUrl}
          alt="background"
          className="absolute inset-0 w-[94%] h-[86%] mt-10 ml-2 object-cover rounded-xl"
          style={{ zIndex: 0 }}
        />
      )}

      <img
        src={BACKGROUND_WINDOW_PATH}
        alt="background window frame"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />

      {/* Outfit encima del fondo */}
      <OutfitCanvas currentIndices={currentIndices} className="absolute inset-0 h-[230px] translate-y-1/3" />

      {/* Botones */}
      {cameraMode !== 'cursor-target' &&
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