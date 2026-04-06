import { useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import { MODEL_PATH } from '../config';

export function useMediaPipe({ videoRef, onResult }) {
  const recognizerRef  = useRef(null);
  const lastTsRef      = useRef(0);
  const rafRef         = useRef(null);
  const onResultRef    = useRef(onResult);
  onResultRef.current  = onResult; // siempre apunta al callback más reciente sin re-suscribir

//   const processFrame = useCallback(() => {
//     const video      = videoRef.current;
//     const recognizer = recognizerRef.current;
//     if (!video || !recognizer || video.readyState < 2) {
//       rafRef.current = requestAnimationFrame(processFrame);
//       return;
//     }

//     const now = performance.now();
//     const ts  = Math.max(lastTsRef.current + 1, now);
//     lastTsRef.current = ts;

//     // recognizeForVideo es la versión síncrona del LIVE_STREAM de Python
//     const result = recognizer.recognizeForVideo(video, ts);
//     onResultRef.current(result);

//     rafRef.current = requestAnimationFrame(processFrame);
//   }, [videoRef]);

const processFrame = useCallback(() => {
  const video      = videoRef.current;
  const recognizer = recognizerRef.current;

  // LOG 1: ¿el loop corre?
  console.log('frame tick — video readyState:', video?.readyState, '| recognizer:', !!recognizer);

  if (!video || !recognizer || video.readyState < 2) {
    rafRef.current = requestAnimationFrame(processFrame);
    return;
  }

  const now = performance.now();
  const ts  = Math.max(lastTsRef.current + 1, now);
  lastTsRef.current = ts;

  const result = recognizer.recognizeForVideo(video, ts);

  // LOG 2: ¿qué devuelve MediaPipe exactamente?
  console.log('MP result:', result);
  console.log('MP result keys:', result ? Object.keys(result) : 'null');

  onResultRef.current(result);
  rafRef.current = requestAnimationFrame(processFrame);
}, [videoRef]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );

      const recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' },
        runningMode: 'VIDEO',   // equivale a LIVE_STREAM pero sin callback — devuelve sync
        numHands: 1,
      });

      if (cancelled) { recognizer.close(); return; }
      recognizerRef.current = recognizer;

      // Obtener webcam
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }

      rafRef.current = requestAnimationFrame(processFrame);
    }

    init().catch(console.error);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      recognizerRef.current?.close();
      const video = videoRef.current;
      video?.srcObject?.getTracks().forEach(t => t.stop());
    };
  }, [processFrame, videoRef]);
}