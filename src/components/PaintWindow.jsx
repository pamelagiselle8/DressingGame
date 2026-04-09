import OutfitCanvas from './OutfitCanvas';
import {
  PAINT_WINDOW_PATH,
  NEXT_BUTTON_PATH,
} from '../config';

export default function PaintWindow({ currentIndices, onConfirm }) {
  return (
    <div className="relative w-[400px] h-[380px] select-none">
      {/* Marco decorativo (paint_window.png) */}
      <img
        src={PAINT_WINDOW_PATH}
        alt="paint window frame"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      // style={{ zIndex: 0 }}
      />

      {/* Área de contenido del outfit */}
      <div
        className="absolute"
        style={{ top: 40, left: 95, width: 214, height: 294, zIndex: 5 }}
      >
        {/* <OutfitCanvas currentIndices={currentIndices} /> */}
        <OutfitCanvas currentIndices={currentIndices} className="absolute inset-0 h-[230px] translate-y-1/7" />
      </div>

      {/* Botón confirmar */}
      <img
        className='absolute cursor-pointer hover:scale-105 active:scale-95 transition-transform'
        style={{ top: 325, left: 140, width: 122, height: 34, zIndex: 15 }}
        src={NEXT_BUTTON_PATH} alt='confirm outfit'
        onClick={onConfirm}
      />
      {/* <button
        onClick={onConfirm}
        className="absolute cursor-pointer bg-white border border-gray-400 text-gray-800 text-xs font-medium rounded px-2 py-1 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        style={{ top: 372, left: 91, width: 122, height: 34, zIndex: 15 }}
      >
        Confirm outfit
      </button> */}
    </div>
  );
}