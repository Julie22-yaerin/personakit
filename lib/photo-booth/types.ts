export interface PhotoBoothState {
  phase: 'preparation' | 'action_transition' | 'end_target' | 'completed';
  poseAlignmentScore: number; // 0 to 100
  telemetry: {
    lightingOptimal: boolean;
    audioLevel: number;
    backgroundClear: boolean;
  };
  scriptState: {
    fullText: string;
    currentWordIndex: number;
  };
  assets: {
    startPoseImage: string;
    endPoseImage: string;
  };
}

export const INITIAL_PHOTO_BOOTH_STATE: PhotoBoothState = {
  phase: 'preparation',
  poseAlignmentScore: 0,
  telemetry: {
    lightingOptimal: true,
    audioLevel: 0,
    backgroundClear: true,
  },
  scriptState: {
    fullText: "Welcome to the interactive photo booth. Please align with the start pose, speak clearly, and hit the end pose when finished.",
    currentWordIndex: 0,
  },
  assets: {
    startPoseImage: "https://images.unsplash.com/photo-1599824244246-857c0e819b13?auto=format&fit=crop&q=80&w=400&h=600", // placeholder
    endPoseImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=600", // placeholder
  },
};
