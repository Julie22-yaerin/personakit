# Vision Test Harness

This module is a test harness designed to validate an architectural flow for a filming interface that uses a Multimodal AI API (e.g., Meta Llama Vision or Qwen) to analyze the camera feed and verify if the user is executing a sequence of steps correctly.

The primary goal of this harness is to ensure that the main camera feed (the filming frame) does not freeze or drop frames while waiting for the AI response, which involves network latency.

## Features
- **Video Capture:** Continuous webcam frame capture using OpenCV in the main thread.
- **Plan Manager:** Manages a predefined sequence of tasks (e.g., showing a textbook, pointing to a diagram) with a fallback timer.
- **Async API Processing:** A thread-safe background worker (`queue.Queue`) extracts frames, sends them to a mock API, and stores results without blocking the UI.
- **Visual Overlay:** Status overlay on the video feed displaying the current step, a timer, and real-time AI status ("AI Analyzing..." vs "Verified").

## Architecture
- `main.py`: Main entry point. Handles OpenCV video capture and GUI.
- `plan_manager.py`: Logic for advancing and keeping track of steps.
- `async_processor.py`: Background threading and task queue to manage network calls.
- `api_client.py`: Mock API client mimicking a vision model with simulated latency.

## How to Run

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the application:**
   ```bash
   python main.py
   ```

**Note for Headless Environments:**
If the webcam (`/dev/video0`) is unavailable, the application gracefully falls back to generating a dummy video feed. If the environment has no display (e.g., CI/CD), OpenCV GUI functions (`imshow`) fail gracefully, printing text status directly to standard output to prove it works continuously.