import threading
import queue
import time
from typing import Optional, Tuple
import numpy as np
try:
    from .api_client import APIClient
except ImportError:
    from api_client import APIClient

class AsyncProcessor:
    """
    Manages a background thread to process API calls asynchronously.
    Ensures the main video loop never blocks.
    """
    def __init__(self, api_client: APIClient):
        self.api_client = api_client
        # Queue for sending (frame, step_description) to the worker
        self.task_queue = queue.Queue(maxsize=1)
        # Thread-safe storage for the latest result (verified: bool, step_description: str)
        self.latest_result_lock = threading.Lock()
        self.latest_result: Optional[Tuple[bool, str]] = None

        # Thread status flags
        self.is_running = False
        self.worker_thread = None
        self.is_analyzing = False

    def start(self) -> None:
        """Starts the background worker thread."""
        if not self.is_running:
            self.is_running = True
            self.worker_thread = threading.Thread(target=self._worker_loop, daemon=True)
            self.worker_thread.start()

    def stop(self) -> None:
        """Signals the background thread to stop and waits for it."""
        self.is_running = False
        if self.worker_thread is not None:
            self.worker_thread.join()

    def submit_task(self, frame: np.ndarray, step_description: str) -> bool:
        """
        Submits a task to the background queue if it's not busy.
        Returns True if task was submitted, False if the worker is already busy.
        """
        try:
            # Using nowait prevents blocking the main thread if the queue is full
            self.task_queue.put_nowait((frame, step_description))
            self.is_analyzing = True
            return True
        except queue.Full:
            return False

    def get_latest_result(self) -> Optional[Tuple[bool, str]]:
        """
        Retrieves the latest verification result and clears it.
        Returns a tuple of (is_verified, step_description) or None if no new result.
        """
        with self.latest_result_lock:
            result = self.latest_result
            self.latest_result = None
            return result

    def _worker_loop(self) -> None:
        """The main loop for the background thread."""
        while self.is_running:
            try:
                # Wait for a task, timeout allows periodic checks of self.is_running
                frame, step_description = self.task_queue.get(timeout=0.1)

                # Perform the blocking API call
                is_verified = self.api_client.verify_step(frame, step_description)

                # Store the result safely
                with self.latest_result_lock:
                    self.latest_result = (is_verified, step_description)

                self.is_analyzing = False
                self.task_queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                print(f"Error in background worker: {e}")
                self.is_analyzing = False
