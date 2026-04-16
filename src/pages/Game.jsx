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
    SHUTTER_SOUND_PATH,
    COMPATIBILITY_MESSAGE_PATH_L,
    COMPATIBILITY_MESSAGE_PATH_M,
    COMPATIBILITY_MESSAGE_PATH_S,
    CAMERA_WINDOW_PATH,
    HELP_BUTTON_PATH,
    IN_GAME_INSTRUCTIONS_IMAGE_PATH,
    CLOSE_BUTTON_PATH,
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

    async function handleSave() {
        // 1 — sonido primero, sin await
        const sfx = shutterRef.current;
        if (sfx) { sfx.currentTime = 0; sfx.play().catch(() => { }); }

        // 2 — pequeña pausa para que el browser procese el audio antes del canvas
        await new Promise(resolve => setTimeout(resolve, 80));

        // 3 — renderizar canvas
        const WIDTH = 800, HEIGHT = 800;
        const canvas = document.createElement('canvas');
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        const ctx = canvas.getContext('2d');

        function loadImage(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
            });
        }

        const bgUrl = assetLibrary.get('background', state.backgroundIndex);
        if (bgUrl) {
            const bg = await loadImage(bgUrl);
            ctx.drawImage(bg, 0, 0, WIDTH, HEIGHT);
        }

        const CHAR_W = WIDTH * 0.7, CHAR_H = HEIGHT * 0.7;
        const CHAR_X = (WIDTH - CHAR_W) / 2, CHAR_Y = (HEIGHT - CHAR_H) / 2;
        const DISPLAY_ORDER = ['body', 'bottom', 'top', 'shoes', 'nose', 'eyes'];

        for (const part of DISPLAY_ORDER) {
            const url = assetLibrary.get(part, state.currentIndices[part] ?? 0);
            if (!url) continue;
            const img = await loadImage(url);
            ctx.drawImage(img, CHAR_X, CHAR_Y, CHAR_W, CHAR_H);
        }

        // 4 — descargar
        const link = document.createElement('a');
        link.download = 'MyOutfit.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    const shutterRef = useRef(null);

    const [showInstructions, setShowInstructions] = useState(false);

    return (
        <div className="min-h-screen bg-[#fff9fc] flex items-start justify-center gap-4">
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

            <div className='relative lg:hidden block min-h-screen min-w-screen flex items-center justify-center pt-10'>
                <img className='w-[90vw] max-w-[80vh]'
                    src={COMPATIBILITY_MESSAGE_PATH_L}
                    srcSet={`${COMPATIBILITY_MESSAGE_PATH_S} 320w, ${COMPATIBILITY_MESSAGE_PATH_M} 768w, ${COMPATIBILITY_MESSAGE_PATH_L} 1024w`}
                    alt='home' />
            </div>

            <div
                className={`hidden lg:flex absolute min-h-screen min-w-screen items-center justify-center backdrop-blur-sm rounded-xl p-4 z-30
                            transition-all duration-500 ease-out
                            ${showInstructions
                        ? 'opacity-100 scale-100 pointer-events-auto'
                        : 'opacity-0 scale-95 pointer-events-none'
                    }`}
                onClick={() => setShowInstructions(false)}
            >
                <img
                    className='w-[80vw] max-w-[50vh]'
                    src={IN_GAME_INSTRUCTIONS_IMAGE_PATH}
                    alt='in-game instructions'
                    onClick={(e) => e.stopPropagation()}
                />
                <img
                    className='absolute h-9 cursor-pointer hover:scale-105 transition-transform'
                    style={{ top: '73.8%' }}
                    src={CLOSE_BUTTON_PATH}
                    alt='close'
                    onClick={() => setShowInstructions(false)}
                />
            </div>

            <div className="relative hidden lg:flex flex-col justify-center min-h-screen min-w-screen bg-pink-400/10 rounded-xl overflow-hidden">
                <audio ref={swipeAudioRef} src={SWIPE_SOUND_PATH} />
                <audio ref={shutterRef} src={SHUTTER_SOUND_PATH} />
                <div className='w-full flex justify-end p-8 top-0 absolute z-20'>
                    <img
                        src={HELP_BUTTON_PATH}
                        alt='help'
                        className='w-10 cursor-pointer hover:scale-110 transition-transform'
                        onClick={() => {
                            setShowInstructions(true);
                        }}
                    />
                </div>

                <div className='flex items-center justify-center'>
                    <div className="relative rounded-xl overflow-hidden w-[540px] h-[380px] flex-shrink-0">
                        <img src={CAMERA_WINDOW_PATH} alt='camera tab' className='absolute h-full pointer-events-none z-10 bg-pink-400/10 rounded-xl' />
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

                    {/* Panel derecho: PaintWindow u BackgroundStage */}
                    <div className="flex-shrink-0 w-[400px] flex items-center justify-center">
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

            </div>
        </div>
    );
}