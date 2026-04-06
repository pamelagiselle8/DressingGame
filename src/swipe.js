import { POSITION_HISTORY_SIZE } from './config';
import { distance } from './mediapipeHelpers';

const positionHistory = {};

function isHandClosedWithIndexOnly(landmarks) {
  const wrist     = landmarks[0];
  const indexTip  = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip   = landmarks[16];
  const pinkyTip  = landmarks[20];

  const indexDist  = distance(wrist, indexTip);
  const middleDist = distance(wrist, middleTip);
  const ringDist   = distance(wrist, ringTip);
  const pinkyDist  = distance(wrist, pinkyTip);

  const indexExtended = indexDist > 0.15;
  const othersClosed  =
    middleDist < indexDist * 0.7 &&
    ringDist   < indexDist * 0.7 &&
    pinkyDist  < indexDist * 0.7;

  return indexExtended && othersClosed;
}

export function detectSwipe(landmarks, handId = 'right') {
  if (!isHandClosedWithIndexOnly(landmarks)) return null;

  const indexTip = landmarks[8];
  const indexMcp = landmarks[5];
  const current  = [indexTip.x - indexMcp.x, indexTip.y - indexMcp.y];

  if (!positionHistory[handId]) positionHistory[handId] = [];
  const history = positionHistory[handId];
  history.push(current);
  if (history.length > POSITION_HISTORY_SIZE) history.shift();
  if (history.length < 3) return null;

  const [oldX, oldY] = history[0];
  const [newX, newY] = history[history.length - 1];
  const dx = newX - oldX;
  const dy = newY - oldY;

  if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 0.04)
    return dy < 0 ? 'up' : 'down';

  if (Math.abs(dx) > 0.04)
    return dx > 0 ? 'right' : 'left';

  return null;
}

export function clearSwipeHistory(handId) {
  delete positionHistory[handId];
}