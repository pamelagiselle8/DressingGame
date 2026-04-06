import { useReducer } from 'react';
import { PART_ORDER } from '../config';

const initialState = {
  currentIndices:  Object.fromEntries(PART_ORDER.map(p => [p, 0])),
  selectedPart:    'body',
  selectionStage:  'outfit',   // 'outfit' | 'background'
  backgroundIndex: 0,
  lastSwipeTime:   0,
};

function reducer(state, action) {
  switch (action.type) {
    case 'STEP_MODE': {
      const idx = PART_ORDER.indexOf(state.selectedPart);
      const next = action.direction === 'up'
        ? (idx + 1) % PART_ORDER.length
        : (idx - 1 + PART_ORDER.length) % PART_ORDER.length;
      return { ...state, selectedPart: PART_ORDER[next] };
    }
    case 'STEP_INDEX': {
      const { count } = action;
      if (count <= 0) return state;
      const cur = state.currentIndices[state.selectedPart] ?? 0;
      const next = action.direction === 'right'
        ? (cur + 1) % count
        : (cur - 1 + count) % count;
      return {
        ...state,
        currentIndices: { ...state.currentIndices, [state.selectedPart]: next },
      };
    }
    case 'STEP_BACKGROUND': {
      const { count } = action;
      if (count <= 0) return state;
      const next = action.direction === 'right'
        ? (state.backgroundIndex + 1) % count
        : (state.backgroundIndex - 1 + count) % count;
      return { ...state, backgroundIndex: next };
    }
    case 'CONFIRM_OUTFIT':
      return { ...state, selectionStage: 'background', selectedPart: 'background' };
    case 'EDIT_OUTFIT':
      return { ...state, selectionStage: 'outfit', selectedPart: 'body' };
    case 'SET_SWIPE_TIME':
      return { ...state, lastSwipeTime: action.time };
    default:
      return state;
  }
}

export function useOutfitState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return {
    state,
    stepMode:        (direction)         => dispatch({ type: 'STEP_MODE', direction }),
    stepIndex:       (direction, count)  => dispatch({ type: 'STEP_INDEX', direction, count }),
    stepBackground:  (direction, count)  => dispatch({ type: 'STEP_BACKGROUND', direction, count }),
    confirmOutfit:   ()                  => dispatch({ type: 'CONFIRM_OUTFIT' }),
    editOutfit:      ()                  => dispatch({ type: 'EDIT_OUTFIT' }),
    setSwipeTime:    (time)              => dispatch({ type: 'SET_SWIPE_TIME', time }),
  };
}