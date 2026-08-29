import time
from typing import List, Dict, Any, Optional

class PlanManager:
    """
    Manages the predefined sequence of tasks (Plan).
    Steps should look like: {"step": "show the textbook", "duration": 5}
    """
    def __init__(self, plan_steps: List[Dict[str, Any]]):
        self.plan_steps = plan_steps
        self.current_step_index = 0
        self.step_start_time = time.time()
        self.is_completed = False

    def get_current_step(self) -> Optional[Dict[str, Any]]:
        """Returns the current step or None if completed."""
        if self.is_completed or self.current_step_index >= len(self.plan_steps):
            return None
        return self.plan_steps[self.current_step_index]

    def update(self) -> None:
        """
        Updates the timer and advances the step if the duration has passed.
        This allows for basic time-based progression in lieu of actual AI verification driving it.
        """
        current_step = self.get_current_step()
        if not current_step:
            return

        elapsed = time.time() - self.step_start_time
        duration = current_step.get("duration", 5)

        if elapsed >= duration:
            self.advance_step()

    def advance_step(self) -> None:
        """Advances to the next step manually or when time is up."""
        self.current_step_index += 1
        self.step_start_time = time.time()
        if self.current_step_index >= len(self.plan_steps):
            self.is_completed = True

    def get_time_remaining(self) -> float:
        """Returns time remaining for current step, bounded at 0."""
        current_step = self.get_current_step()
        if not current_step:
            return 0.0

        elapsed = time.time() - self.step_start_time
        duration = current_step.get("duration", 5)
        return max(0.0, duration - elapsed)

    def reset(self) -> None:
        """Resets the plan to the beginning."""
        self.current_step_index = 0
        self.step_start_time = time.time()
        self.is_completed = False
