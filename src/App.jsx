import { useState, useRef, useCallback, useEffect } from 'react';
import DebugOverlay from './components/DebugOverlay';
import { useOutfitState } from './hooks/useOutfitState';
import { useMediaPipe }   from './hooks/useMediaPipe';
import { assetLibrary }   from './assets';
import { detectSwipe }    from './swipe';
import { angleFromWristToIndexMcp, handOpenness } from './mediapipeHelpers';
import { SWIPE_COOLDOWN } from './config';
import PaintWindow        from './components/PaintWindow';
import BackgroundStage    from './components/BackgroundStage';

export default function App() {
  const videoRef = useRef(null);
  const { state, stepMode, stepIndex, stepBackground, confirmOutfit, editOutfit, setSwipeTime } = useOutfitState();

  // Guarda el stage actual en un ref para leerlo dentro del callback sin stale closure
  const stageRef = useRef(state.selectionStage);
  stageRef.current = state.selectionStage;
  const stateRef = useRef(state);
  stateRef.current = state;

  const [debugInfo, setDebugInfo] = useState({
    landmarks:    null,
    handedness:   null,
    lastSwipe:    null,
    swipeBlocked: false,
  });

  const handleResult = useCallback((result) => {
  // Siempre actualizar landmarks para que el skeleton se vea
  setDebugInfo(prev => ({
    ...prev,
    landmarks:  result?.landmarks  ?? null,
    handedness: result?.handednesses     ?? null,
  }));

  if (!result?.landmarks?.length) return;

  result.landmarks.forEach((landmarks, i) => {
    const handLabel = result.handednesses?.[i]?.[0]?.categoryName;
    if (handLabel !== 'Right') return;

    const direction = detectSwipe(landmarks, 'right');

    // Siempre mostrar qué swipe detectó, aunque esté en cooldown
    if (direction) {
      const now = performance.now() / 1000;
      const blocked = now - stateRef.current.lastSwipeTime < SWIPE_COOLDOWN;

      setDebugInfo(prev => ({ ...prev, lastSwipe: direction, swipeBlocked: blocked }));

      if (blocked) return;
      setSwipeTime(now);

      const stage = stageRef.current;
      if (stage === 'outfit') {
        if (direction === 'up' || direction === 'down') {
          stepMode(direction);
        } else {
          stepIndex(direction, assetLibrary.count(stateRef.current.selectedPart));
        }
      } else if (stage === 'background') {
        if (direction === 'left' || direction === 'right') {
          stepBackground(direction, assetLibrary.count('background'));
        }
      }
    }
  });
}, [stepMode, stepIndex, stepBackground, setSwipeTime]);

  useMediaPipe({ videoRef, onResult: handleResult });

  // Atajos de teclado (c → confirmar, e → editar, s → guardar)
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'c' && state.selectionStage === 'outfit')      confirmOutfit();
      if (e.key === 'e' && state.selectionStage === 'background')  editOutfit();
      if (e.key === 's' && state.selectionStage === 'background')  handleSave();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.selectionStage, confirmOutfit, editOutfit]);

  function handleSave() {
    // Usar html2canvas o similar para capturar BackgroundStage
    // Por ahora: placeholder
    console.log('Save:', state.currentIndices, 'bg:', state.backgroundIndex);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center gap-4 p-4">
      {/* Feed de webcam */}
      <div className="relative rounded-xl overflow-hidden shadow-xl w-[640px] h-[480px] bg-black flex-shrink-0">
        <video
          ref={videoRef}
          className="w-full h-full object-cover scale-x-[-1]" // mirror
          muted
          playsInline
        />
        <DebugOverlay
          landmarks={debugInfo.landmarks}
          handedness={debugInfo.handedness}
          lastSwipe={debugInfo.lastSwipe}
          selectedPart={state.selectedPart}
          swipeBlocked={debugInfo.swipeBlocked}
        />
        {/* HUD: parte actualmente seleccionada */}
        {state.selectionStage === 'outfit' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-4 py-1.5 rounded-full backdrop-blur">
            Editing: <span className="font-semibold capitalize">{state.selectedPart}</span>
          </div>
        )}
      </div>

      {/* Panel derecho: PaintWindow u BackgroundStage */}
      <div className="flex-shrink-0 w-[400px] h-[480px] flex items-center justify-center">
        {state.selectionStage === 'outfit' ? (
          <PaintWindow
            currentIndices={state.currentIndices}
            onConfirm={confirmOutfit}
          />
        ) : (
          <BackgroundStage
            currentIndices={state.currentIndices}
            backgroundIndex={state.backgroundIndex}
            onEdit={editOutfit}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}