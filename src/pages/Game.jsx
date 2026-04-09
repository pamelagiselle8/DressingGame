import { useState, useRef, useCallback, useEffect } from 'react';
import DebugOverlay from '../components/DebugOverlay';
import { useOutfitState } from '../hooks/useOutfitState';
import { useMediaPipe } from '../hooks/useMediaPipe';
import { assetLibrary } from '../assets';
import { detectSwipe } from '../swipe';
import PaintWindow from '../components/PaintWindow';
import BackgroundStage from '../components/BackgroundStage';
import { useMusic } from '../AudioContext.jsx';
import Grainient from '../components/Grainient.jsx';
import {
    SWIPE_COOLDOWN,
    SWIPE_SOUND_PATH,
    COMPATIBILITY_MESSAGE_PATH,
    CAMERA_WINDOW_PATH,
} from '../config';

export default function Game() {
    const { unlockAndPlay } = useMusic();
    useEffect(() => {
        unlockAndPlay();
    }, []);

    const swipeAudioRef = useRef(null);
    const videoRef = useRef(null);
    const { state, stepMode, stepIndex, stepBackground, confirmOutfit, editOutfit, setSwipeTime } = useOutfitState();

    // Guarda el stage actual en un ref para leerlo dentro del callback sin stale closure
    const stageRef = useRef(state.selectionStage);
    stageRef.current = state.selectionStage;
    const stateRef = useRef(state);
    stateRef.current = state;

    const [debugInfo, setDebugInfo] = useState({
        landmarks: null,
        handedness: null,
        lastSwipe: null,
        swipeBlocked: false,
    });

    const handleResult = useCallback((result) => {
        // Siempre actualizar landmarks para que el skeleton se vea
        setDebugInfo(prev => ({
            ...prev,
            landmarks: result?.landmarks ?? null,
            handedness: result?.handednesses ?? null,
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


                const audio = swipeAudioRef.current;
                if (audio) {
                    audio.currentTime = 0;
                    audio.play();
                }
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
            if (e.key === 'c' && state.selectionStage === 'outfit') confirmOutfit();
            if (e.key === 'e' && state.selectionStage === 'background') editOutfit();
            if (e.key === 's' && state.selectionStage === 'background') handleSave();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [state.selectionStage, confirmOutfit, editOutfit]);

    function handleSave() {
        // Usar html2canvas o similar para capturar BackgroundStage
        console.log('Saving image...');
    }

    return (
        <div className="min-h-screen bg-[#fff9fc] flex items-center justify-center gap-4 p-4">
            <div style={{ width: '100%', height: '100%', position: 'absolute', zIndex: 0 }}>
                <Grainient
                    color1="#ffb2dd"
                    color2="#fed6f8"
                    color3="#fea2d6"
                    timeSpeed={1.5}
                    colorBalance={0}
                    warpStrength={1}
                    warpFrequency={5}
                    warpSpeed={2}
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
                <img className='w-[90vw] max-w-[80vh]' src={COMPATIBILITY_MESSAGE_PATH} alt='home' />
            </div>


            <div className="relative hidden lg:flex items-center justify-center">
                <audio ref={swipeAudioRef} src={SWIPE_SOUND_PATH} />
                <div className="relative rounded-xl overflow-hidden w-[540px] h-[380px] flex-shrink-0">
                    <img src={CAMERA_WINDOW_PATH} alt='camera tab' className='absolute h-full pointer-events-none z-10 bg-pink-400/10' />
                    <div className="relative rounded-xl overflow-hidden mt-9 ml-2 w-[495px] h-[335px] flex-shrink-0">
                        <video
                            ref={videoRef}
                            className="absolute h-full w-auto object-cover scale-x-[-1]" // mirror
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
                        {state.selectionStage === 'outfit' && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-2/3 bg-black/40 text-white text-sm px-4 py-1.5 rounded-full backdrop-blur">
                                Editing: <span className="font-semibold capitalize text-[#ffa9d8]">{state.selectedPart}</span>
                            </div>
                        )}
                    </div>
                </div>
                {/* Feed de webcam */}

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
                    {/* <BackgroundStage
                            currentIndices={state.currentIndices}
                            backgroundIndex={state.backgroundIndex}
                            onEdit={editOutfit}
                            onSave={handleSave}
                        /> */}
                </div>
            </div>
        </div>
    );
}