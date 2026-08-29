import time
import random
import numpy as np

class APIClient:
    """
    Mock API client for sending frames and verifying steps against a multimodal AI.
    Structured to be easily replaceable with real requests to Llama Vision, Qwen, etc.
    """
    def __init__(self, latency: float = 1.0):
        self.latency = latency

    def dummy_api_caller(self, frame: np.ndarray, step_description: str) -> bool:
        """
        Simulates an API call that analyzes a frame to verify the current step.
        Blocks for self.latency seconds to simulate network and processing time.

        Args:
            frame: OpenCV image array
            step_description: The text of the step being verified

        Returns:
            bool: True if verified, False otherwise
        """
        # Simulate network delay and inference time
        time.sleep(self.latency)

        # We can simulate verification logic here. For now, it randomly returns True or False
        # to simulate the AI sometimes thinking the step is complete and sometimes not.
        # It's biased towards True to ensure we can eventually proceed.
        # Alternatively, we just return True for demonstration, but let's make it random
        # to show real-world uncertainty, say 70% chance of True.

        is_verified = random.random() > 0.3
        return is_verified

    def verify_step(self, frame: np.ndarray, step_description: str) -> bool:
        """
        Public method to call. This allows swapping `dummy_api_caller` with a real
        API implementation in the future.
        """
        return self.dummy_api_caller(frame, step_description)
