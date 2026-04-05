from dataclasses import dataclass, field

from .config import PART_ORDER


@dataclass
class OutfitState:
    current_indices: dict[str, int] = field(default_factory=lambda: {part: 0 for part in PART_ORDER})
    selected_part: str = 'body'
    last_swipe_time: float = 0.0

    def step_mode(self, direction: str) -> None:
        index = PART_ORDER.index(self.selected_part)
        if direction == 'up':
            self.selected_part = PART_ORDER[(index + 1) % len(PART_ORDER)]
        elif direction == 'down':
            self.selected_part = PART_ORDER[(index - 1) % len(PART_ORDER)]

    def step_current_index(self, direction: str, available_count: int) -> None:
        if available_count <= 0:
            return

        current = self.current_indices.get(self.selected_part, 0)
        if direction == 'right':
            current = (current + 1) % available_count
        elif direction == 'left':
            current = (current - 1) % available_count
        self.current_indices[self.selected_part] = current
