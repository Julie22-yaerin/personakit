1. **Document Style Examples for the Central System**
   - Create a framework instructions file specifically for generative image requests: `harness/framework/101-muse-spark-style.md`.
   - Instruct the AI on the required "doodle illustration" visual style, providing relative paths (`/assets/doodle_style_examples/IMG_4110.jpeg` and `/assets/doodle_style_examples/AQMTxlIu8HPr3xTjGLkfMcfR8XrZkB835J4KXWJK7ywgOwiiZj0LvId9kaPZPpl6zERQW6AbXsp-RK44kbyduqcH.webp`) as few-shot examples for the generative API ("Muse Spark") to mimic.
   - Verify creation with `ls harness/framework`.

2. **Add an Onboarding Face Scan Flow (`app/onboarding/face-scan/page.tsx`)**
   - The user requested that the face capture and Muse Spark doodle generation happen *after* the founders' onboarding quiz.
   - Since `app/onboarding/OnboardingFlow.tsx` ends by saving data and navigating to `/board` (or previously `/app`), I will change its redirect from `/board` to `/onboarding/face-scan`.
   - Create a new Next.js page at `app/onboarding/face-scan/page.tsx`. This page will use `navigator.mediaDevices.getUserMedia` to access the webcam and display a video feed.
   - Add a button to capture a frame from the video using a `<canvas>`.
   - Verify the routing changes and new UI implementation by checking the file contents.

3. **Implement the mock "Muse Spark" API and Integration**
   - Create a new mock API function in `lib/muse-spark.ts` (e.g., `generateDoodle(imageDataUrl: string)`) that simulates a call to Muse Spark by waiting briefly and returning one of the static doodle style example paths.
   - Update `app/onboarding/face-scan/page.tsx` to call this `generateDoodle` function when a photo is captured.
   - The page should display a "Generating your doodle..." loading state, then show the returned doodle, and provide a "Continue to Dashboard" button that redirects to `/board`.
   - Verify the implementation of the mock API and its integration into the page.

4. **Persist the generated Doodle**
   - Create a new API route `app/api/onboarding/save-doodle/route.ts` that takes the `doodleUrl` and updates the user's Firestore document.
   - Update the "Continue to Dashboard" button in `app/onboarding/face-scan/page.tsx` to call this new route before redirecting to `/board`.
   - Verify the API route and the updated UI file.

5. **Run Tests and Verification**
   - Run a typecheck (`npx tsc --noEmit`) and build (`npm run build`) to ensure there are no compilation errors or regressions introduced by the changes.

6. **Pre-commit Checks**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

7. **Submit**
   - Submit the changes using the `submit` tool.
