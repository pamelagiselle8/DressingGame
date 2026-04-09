import { assetLibrary } from '../assets';
import OutfitCanvas from './OutfitCanvas';
import {
  BACKGROUND_WINDOW_PATH,
  NEXT_BUTTON_PATH,
  BACK_BUTTON_PATH,
 } from '../config';

export default function BackgroundStage({ currentIndices, backgroundIndex, onEdit, onSave }) {
  const bgUrl = assetLibrary.get('background', backgroundIndex);

  return (
    <div className="relative w-[380px] h-[380px] rounded-xl">
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

      {/* HUD de instrucciones */}
      {/* <div className="absolute top-4 left-4 space-y-1 z-20">
        <p className="text-white text-sm font-medium drop-shadow">Background selection</p>
        <p className="text-white/80 text-xs drop-shadow">Swipe left / right → change background</p>
        <p className="text-white/80 text-xs drop-shadow">Press E to edit outfit again</p>
      </div> */}

      {/* Botones */}
      <div className="absolute bottom-5 flex gap-6 translate-x-1/5 z-20">
        <img
          className='cursor-pointer hover:scale-105 active:scale-95 transition-transform'
          style={{ top: 325, left: 0, width: 122, height: 34, zIndex: 100 }}
          src={BACK_BUTTON_PATH} alt='confirm outfit'
          onClick={onEdit}
        />
        <img
          className='cursor-pointer hover:scale-105 active:scale-95 transition-transform'
          style={{ top: 325, left: 0, width: 122, height: 34, zIndex: 100 }}
          src={NEXT_BUTTON_PATH} alt='confirm outfit'
          onClick={onSave}
        />
        {/* <button
          onClick={onEdit}
          className="bg-white/20 backdrop-blur text-white text-xs px-3 py-1.5 rounded-lg border border-white/30 hover:bg-white/30 transition-colors"
        >
          Edit outfit
        </button>
        <button
          onClick={onSave}
          className="bg-white text-gray-900 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Save image
        </button> */}
      </div>
    </div>
  );
}