import { DISPLAY_ORDER } from '../config';
import { assetLibrary } from '../assets';

export default function OutfitCanvas({ currentIndices, className = '' }) {
  // DISPLAY_ORDER = ['body', 'bottom', 'top', 'shoes', 'nose', 'eyes']
  const layers = DISPLAY_ORDER.map(part => assetLibrary.get(part, currentIndices[part] ?? 0));

  return (
    <div className={`relative ${className}`}>
      {layers.map((url, i) =>
        url ? (
          <img
            key={DISPLAY_ORDER[i]}
            src={url}
            alt={DISPLAY_ORDER[i]}
            className="absolute inset-0 w-full h-full object-contain"
            style={{ zIndex: i + 1 }}
          />
        ) : null
      )}
    </div>
  );
}