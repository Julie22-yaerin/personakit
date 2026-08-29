import cv2
import time
import sys
import numpy as np

# Adjust imports to allow running directly from the directory or module
try:
    from .plan_manager import PlanManager
    from .api_client import APIClient
    from .async_processor import AsyncProcessor
except ImportError:
    from plan_manager import PlanManager
    from api_client import APIClient
    from async_processor import AsyncProcessor

def main():
    # Define a sample plan
    plan_data = [
        {"step": "Show the textbook", "duration": 10},
        {"step": "Point to the diagram", "duration": 10},
        {"step": "Explain the concept clearly", "duration": 10}
    ]

    plan_manager = PlanManager(plan_data)
    api_client = APIClient(latency=1.0)
    async_processor = AsyncProcessor(api_client)

    # Start the background worker
    async_processor.start()

    # Open the webcam
    # We use 0 as the default camera. In a headless environment, this might fail,
    # so we add a fallback to a dummy video feed or handle failure gracefully.
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Warning: Cannot open camera. Falling back to a dummy frame generation.")
        use_dummy_frame = True
    else:
        use_dummy_frame = False

    print("Starting Main Video Loop. Press 'q' to quit.")

    # State variables for overlay
    last_verified_status = "Waiting..."
    status_color = (0, 255, 255) # Yellow

    try:
        while True:
            # Capture frame
            if not use_dummy_frame:
                ret, frame = cap.read()
                if not ret:
                    print("Error: Could not read frame from camera.")
                    break
            else:
                # Generate a dummy frame for testing without a webcam
                frame = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(frame, "Dummy Camera Feed", (150, 240),
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

            current_step = plan_manager.get_current_step()

            if current_step is None:
                # Plan completed
                cv2.putText(frame, "Plan Completed!", (50, 240),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)
            else:
                step_text = current_step["step"]
                time_remaining = plan_manager.get_time_remaining()

                # Check for new results from the async processor
                result = async_processor.get_latest_result()
                if result:
                    is_verified, verified_step = result
                    # Only apply result if it matches the current step
                    if verified_step == step_text:
                        if is_verified:
                            last_verified_status = "Verified!"
                            status_color = (0, 255, 0) # Green
                            # Automatically advance step on successful verification
                            plan_manager.advance_step()
                        else:
                            last_verified_status = "Not Verified"
                            status_color = (0, 0, 255) # Red

                # Try to submit a new task if not already analyzing
                if not async_processor.is_analyzing:
                    last_verified_status = "AI Analyzing..."
                    status_color = (255, 165, 0) # Orange
                    async_processor.submit_task(frame.copy(), step_text)

                # Overlay current step
                cv2.putText(frame, f"Step: {step_text}", (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

                # Overlay timer
                cv2.putText(frame, f"Time: {time_remaining:.1f}s", (10, 60),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

                # Overlay AI Status
                cv2.putText(frame, f"Status: {last_verified_status}", (10, 90),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)

                # Advance time-based if not advanced by verification
                plan_manager.update()

            # Display the frame
            # In a truly headless CI environment without X11, imshow will crash hard (Qt abort).
            # We can detect this or allow an environment variable. For this harness, if we are using
            # a dummy frame, we can assume headless mode might be active or we can use a flag.
            import os
            is_headless = os.environ.get("HEADLESS", "0") == "1"

            if is_headless:
                time.sleep(0.03)
                # Print status every roughly 30 frames (1 sec) to show it's working
                if int(time.time() * 10) % 10 == 0:
                     # Add sys.stdout.flush() to ensure output goes to log
                     print(f"Headless mode: Step='{current_step['step'] if current_step else 'Done'}', Status='{last_verified_status}'", flush=True)
            else:
                try:
                    cv2.imshow('Filming Interface Harness', frame)
                    # Exit on 'q'
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
                except cv2.error:
                    # Fallback if cv2.imshow throws an exception (though usually it aborts at Qt level)
                    pass

    except KeyboardInterrupt:
        print("Interrupted by user.")
    finally:
        # Cleanup
        async_processor.stop()
        if not use_dummy_frame:
            cap.release()
        if not os.environ.get("HEADLESS", "0") == "1":
            try:
                cv2.destroyAllWindows()
            except cv2.error:
                pass

if __name__ == "__main__":
    main()
