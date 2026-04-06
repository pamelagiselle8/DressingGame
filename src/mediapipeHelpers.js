export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function angleFromWristToIndexMcp(landmarks) {
  const wrist    = landmarks[0];
  const indexMcp = landmarks[5];
  const dx = indexMcp.x - wrist.x;
  const dy = wrist.y   - indexMcp.y; // Y invertido igual que Python
  return ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
}

export function handOpenness(landmarks) {
  const wrist     = landmarks[0];
  const palmSize  = Math.max(distance(wrist, landmarks[9]), 1e-6);
  const tipIds    = [4, 8, 12, 16, 20];
  const avgTip    = tipIds.reduce((sum, i) => sum + distance(wrist, landmarks[i]), 0) / tipIds.length;
  return avgTip / palmSize;
}

// Reemplaza hue_to_bgr — devuelve string CSS hsl() directamente
export function hueToCss(hueDegrees, saturation = 1.0) {
  const s = Math.round(Math.min(saturation, 1) * 100);
  return `hsl(${Math.round(hueDegrees)}, ${s}%, 50%)`;
}