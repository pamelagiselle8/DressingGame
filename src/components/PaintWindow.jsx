import { PAINT_WINDOW_PATH } from '../config';
import OutfitCanvas from './OutfitCanvas';

export default function PaintWindow({ currentIndices, onConfirm }) {
  return (
    <div className="relative w-[300px] h-[450px] select-none">
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
        style={{ top: 69, left: 74, width: 214, height: 294, zIndex: 5 }}
      >
        <OutfitCanvas currentIndices={currentIndices} />
      </div>

      {/* Botón confirmar */}
      <button
        onClick={onConfirm}
        className="absolute cursor-pointer bg-white border border-gray-400 text-gray-800 text-xs font-medium rounded px-2 py-1 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        style={{ top: 372, left: 91, width: 122, height: 34, zIndex: 15 }}
      >
        Confirm outfit
      </button>
    </div>
  );
}