import { assetLibrary } from '../assets';
import OutfitCanvas from './OutfitCanvas';

export default function BackgroundStage({ currentIndices, backgroundIndex, onEdit, onSave }) {
  const bgUrl = assetLibrary.get('background', backgroundIndex);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl">
      {/* Fondo */}
      {bgUrl && (
        <img
          src={bgUrl}
          alt="background"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        />
      )}

      {/* Outfit encima del fondo */}
      <OutfitCanvas currentIndices={currentIndices} className="absolute inset-0" />

      {/* HUD de instrucciones */}
      <div className="absolute top-4 left-4 space-y-1 z-20">
        <p className="text-white text-sm font-medium drop-shadow">Background selection</p>
        <p className="text-white/80 text-xs drop-shadow">Swipe left / right → change background</p>
        <p className="text-white/80 text-xs drop-shadow">Press E to edit outfit again</p>
      </div>

      {/* Botones */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-20">
        <button
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
        </button>
      </div>
    </div>
  );
}