/**
 * Filming Studio Interface — HUD Overlay State Interface
 * Unified real-time telemetry model combining computer vision face detection,
 * environmental telemetry, action & object trackers, shot checklist, and auto-cut timers.
 */

export type MoodState = 'neutral' | 'smile' | 'excited' | 'serious';
export type LightingQuality = 'poor' | 'good' | 'overexposed';
export type BackgroundQuality = 'clean' | 'distracting';
export type PositioningState = 'centered' | 'off-center' | 'too-close' | 'too-far';
export type SpeechPaceState = 'slow' | 'optimal' | 'fast';
export type ScenePerspectiveType = 'creator_face' | 'terminal_screen' | 'object_close_up';
export type MovementState = 'stationary' | 'entering' | 'moving_fast';

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface FilmingOverlayState {
  expression: {
    smileIntensity: number; // 0 - 100
    currentMood: MoodState;
    targetMoodMatch: boolean;
  };
  telemetry: {
    lighting: LightingQuality;
    backgroundQuality: BackgroundQuality;
    positioning: PositioningState;
    speechPace: SpeechPaceState;
  };
  actions: {
    sceneType: ScenePerspectiveType;
    detectedObjects: string[];
    movementState: MovementState;
  };
  checklist: ChecklistItem[];
  recordingStatus: {
    isRecording: boolean;
    elapsedSeconds: number;
    maxDuration: number;
    autoCutTriggered: boolean;
  };
}

export const INITIAL_OVERLAY_STATE: FilmingOverlayState = {
  expression: {
    smileIntensity: 78,
    currentMood: 'smile',
    targetMoodMatch: true,
  },
  telemetry: {
    lighting: 'good',
    backgroundQuality: 'clean',
    positioning: 'centered',
    speechPace: 'optimal',
  },
  actions: {
    sceneType: 'creator_face',
    detectedObjects: ['Mug: Detected', 'Mic: Active'],
    movementState: 'stationary',
  },
  checklist: [
    { id: 'c1', label: 'Hook delivered (0-3s)', completed: true },
    { id: 'c2', label: 'Hold eye contact with lens', completed: true },
    { id: 'c3', label: 'Demonstrate product on desk', completed: false },
    { id: 'c4', label: 'Clear CTA & sign-off', completed: false },
  ],
  recordingStatus: {
    isRecording: false,
    elapsedSeconds: 14,
    maxDuration: 60,
    autoCutTriggered: false,
  },
};
