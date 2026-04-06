import { useEffect, useRef } from 'react';

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],       // pulgar
  [0,5],[5,6],[6,7],[7,8],       // índice
  [0,9],[9,10],[10,11],[11,12],  // medio
  [0,13],[13,14],[14,15],[15,16],// anular
  [0,17],[17,18],[18,19],[19,20],// meñique
  [5,9],[9,13],[13,17],          // palma
];

export default function DebugOverlay({ landmarks, handedness, lastSwipe, selectedPart, swipeBlocked }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks?.length) return;

    landmarks.forEach((hand, hi) => {
      const label = handedness?.[hi]?.[0]?.categoryName ?? '?';
      const isRight = label === 'Right';

      // ── Conexiones del esqueleto ──────────────────────────────
      ctx.strokeStyle = isRight ? '#22d3ee' : '#a78bfa';
      ctx.lineWidth = 1.5;
      HAND_CONNECTIONS.forEach(([a, b]) => {
        const pa = hand[a], pb = hand[b];
        ctx.beginPath();
        // Los landmarks vienen en 0-1 normalizados; la webcam está espejada
        ctx.moveTo((1 - pa.x) * canvas.width, pa.y * canvas.height);
        ctx.lineTo((1 - pb.x) * canvas.width, pb.y * canvas.height);
        ctx.stroke();
      });

      // ── Puntos de landmarks ───────────────────────────────────
      hand.forEach((lm, idx) => {
        const x = (1 - lm.x) * canvas.width;
        const y = lm.y * canvas.height;
        const isKeyPoint = [0, 4, 5, 8].includes(idx); // wrist, thumb tip, index mcp, index tip
        ctx.beginPath();
        ctx.arc(x, y, isKeyPoint ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = idx === 8
          ? '#f59e0b'   // index tip → amarillo
          : idx === 0
          ? '#10b981'   // wrist → verde
          : isRight ? '#67e8f9' : '#c4b5fd';
        ctx.fill();
      });

      // ── Etiqueta de la mano ───────────────────────────────────
      const wrist = hand[0];
      const wx = (1 - wrist.x) * canvas.width;
      const wy = wrist.y * canvas.height + 20;
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = isRight ? '#22d3ee' : '#a78bfa';
      ctx.fillText(label, wx - 16, wy);
    });
  }, [landmarks, handedness]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
      {/* Canvas para el skeleton */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute inset-0 w-full h-full"
      />

      {/* HUD de estado ─ esquina superior izquierda */}
      <div className="absolute top-3 left-3 flex flex-col gap-1">
        {/* Último swipe detectado */}
        <SwipeBadge direction={lastSwipe} blocked={swipeBlocked} />

        {/* Parte seleccionada */}
        <div className="bg-black/60 text-white text-xs font-mono px-2 py-1 rounded backdrop-blur">
          part: <span className="text-yellow-300 font-bold">{selectedPart}</span>
        </div>

        {/* Landmarks count */}
        <div className="bg-black/60 text-white text-xs font-mono px-2 py-1 rounded backdrop-blur">
          hands: <span className={landmarks?.length ? 'text-green-400' : 'text-red-400'}>
            {landmarks?.length ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}

// Badge que flashea cuando llega un swipe
function SwipeBadge({ direction, blocked }) {
  const arrows = { up: '↑', down: '↓', left: '←', right: '→' };
  const colors = {
    up:    'bg-blue-500',
    down:  'bg-purple-500',
    left:  'bg-orange-500',
    right: 'bg-green-500',
  };

  return (
    <div className={`
      text-white text-xs font-mono px-2 py-1 rounded backdrop-blur transition-all duration-150
      ${direction ? colors[direction] : 'bg-black/60'}
      ${blocked ? 'opacity-40' : 'opacity-100'}
    `}>
      swipe: {direction
        ? <span className="font-bold text-sm">{arrows[direction]} {direction}</span>
        : <span className="text-white/50">—</span>
      }
      {blocked && <span className="ml-1 text-white/70">(cooldown)</span>}
    </div>
  );
}