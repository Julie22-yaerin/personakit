/**
 * New Onboarding System — 7 Stages (~2–2.5 minutes)
 * 3-Tier Data Architecture:
 * - Tier 1: Stable Identity (Stored long-term)
 * - Tier 2: Content Preferences (Configurable in settings)
 * - Tier 3: Current Context (Immediate shoot seed)
 */

export interface Option {
  value: string;
  label: string;
  sublabel?: string;
}

export type OnboardingStageId =
  | 'building'
  | 'audience'
  | 'voice'
  | 'appearance'
  | 'filming'
  | 'goal'
  | 'signal';

export interface NewOnboardingData {
  // STAGE 01 — What are you building?
  buildingType: string;
  stage: string;
  buildingDescription: string;

  // STAGE 02 — Who should care?
  targetAudience: string;
  desiredAudienceThought: string;
  onePersonToReach: string;

  // STAGE 03 — Your voice
  voiceStyle: string;
  challengeLevel: number; // 1 (Safe) - 10 (Provocative)
  contrarianOpinion: string;

  // STAGE 04 — How should you appear?
  associatedTraits: string[]; // max 2
  antiFeelTraits: string[];
  rememberedVersion: string;

  // STAGE 05 — What can you actually film?
  filmingLocation: string;
  cameraComfort: string;
  dailyRoutineAction: string;

  // STAGE 06 — Your content goal
  primaryGoal: string;
  preferredContentType: string;
  successDefinition: string;

  // STAGE 07 — The final signal
  currentMessage: string;
  targetEmotion: string;
  oneVideoStatement: string;
}

export const INITIAL_ONBOARDING_DATA: NewOnboardingData = {
  buildingType: '',
  stage: '',
  buildingDescription: '',
  targetAudience: '',
  desiredAudienceThought: '',
  onePersonToReach: '',
  voiceStyle: '',
  challengeLevel: 50,
  contrarianOpinion: '',
  associatedTraits: [],
  antiFeelTraits: [],
  rememberedVersion: '',
  filmingLocation: '',
  cameraComfort: '',
  dailyRoutineAction: '',
  primaryGoal: '',
  preferredContentType: '',
  successDefinition: '',
  currentMessage: '',
  targetEmotion: '',
  oneVideoStatement: '',
};

export interface StageConfig {
  id: OnboardingStageId;
  stageNumber: number;
  title: string;
  subtitle: string;
  eyebrow: string;
}

export const STAGE_CONFIGS: readonly StageConfig[] = [
  {
    id: 'building',
    stageNumber: 1,
    eyebrow: 'STAGE 01 OF 07',
    title: 'What are you building?',
    subtitle: 'Context for your foundation. No fluff, just the core.',
  },
  {
    id: 'audience',
    stageNumber: 2,
    eyebrow: 'STAGE 02 OF 07',
    title: 'Who should care?',
    subtitle: 'The exact audience signal and the thought you want to leave behind.',
  },
  {
    id: 'voice',
    stageNumber: 3,
    eyebrow: 'STAGE 03 OF 07',
    title: 'Your voice & sharpest edge',
    subtitle: 'How you naturally sound and what you believe that others avoid saying.',
  },
  {
    id: 'appearance',
    stageNumber: 4,
    eyebrow: 'STAGE 04 OF 07',
    title: 'How should you appear?',
    subtitle: 'What people remember about you and what your content should never feel like.',
  },
  {
    id: 'filming',
    stageNumber: 5,
    eyebrow: 'STAGE 05 OF 07',
    title: 'What can you actually film?',
    subtitle: 'Content that fits into your actual day — zero studio production required.',
  },
  {
    id: 'goal',
    stageNumber: 6,
    eyebrow: 'STAGE 06 OF 07',
    title: 'Your content goal',
    subtitle: 'What real success looks like for you right now.',
  },
  {
    id: 'signal',
    stageNumber: 7,
    eyebrow: 'STAGE 07 OF 07',
    title: 'The final signal',
    subtitle: 'The immediate thought you want to share with the world today.',
  },
];

export const BUILDING_TYPE_OPTIONS: readonly Option[] = [
  { value: 'startup', label: 'Startup / company', sublabel: 'Building a scalable venture' },
  { value: 'product', label: 'Product / app', sublabel: 'Software, tool, or mobile app' },
  { value: 'personal_brand', label: 'Personal brand', sublabel: 'Founder, executive, or thinker' },
  { value: 'service', label: 'Service / agency', sublabel: 'Consultancy or client studio' },
  { value: 'creator', label: 'Creator business', sublabel: 'Content, community, or digital products' },
  { value: 'other', label: 'Other', sublabel: 'Something unique' },
];

export const STAGE_OPTIONS: readonly Option[] = [
  { value: 'idea', label: 'Just an idea' },
  { value: 'mvp', label: 'Building MVP' },
  { value: 'launched', label: 'Launched' },
  { value: 'first_users', label: 'Getting first users' },
  { value: 'growing', label: 'Growing & scaling' },
];

export const AUDIENCE_OPTIONS: readonly Option[] = [
  { value: 'customers', label: 'Potential customers' },
  { value: 'founders', label: 'Founders / builders' },
  { value: 'investors', label: 'Investors' },
  { value: 'industry', label: 'Industry peers & operators' },
  { value: 'general', label: 'General audience' },
  { value: 'community', label: 'A specific community / niche' },
];

export const AUDIENCE_THOUGHT_OPTIONS: readonly Option[] = [
  { value: 'knows_stuff', label: '“This person knows what they’re doing.”' },
  { value: 'interesting', label: '“This is interesting.”' },
  { value: 'want_to_try', label: '“I want to try this.”' },
  { value: 'follow_journey', label: '“I want to follow their journey.”' },
  { value: 'disagree_listen', label: '“I disagree, but I want to hear more.”' },
];

export const VOICE_STYLE_OPTIONS: readonly Option[] = [
  { value: 'calm_analytical', label: 'Calm & analytical' },
  { value: 'direct_confident', label: 'Direct & confident' },
  { value: 'funny_chaotic', label: 'Funny & chaotic' },
  { value: 'warm_relatable', label: 'Warm & relatable' },
  { value: 'provocative_opinionated', label: 'Provocative & opinionated' },
  { value: 'story_driven', label: 'Story-driven' },
];

export const ASSOCIATED_TRAITS_OPTIONS: readonly Option[] = [
  { value: 'expertise', label: 'Expertise' },
  { value: 'ambition', label: 'Ambition' },
  { value: 'creativity', label: 'Creativity' },
  { value: 'intelligence', label: 'Intelligence' },
  { value: 'humor', label: 'Humor' },
  { value: 'authenticity', label: 'Authenticity' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'curiosity', label: 'Curiosity' },
  { value: 'rebellion', label: 'Rebellion' },
];

export const ANTI_FEEL_OPTIONS: readonly Option[] = [
  { value: 'corporate', label: 'Corporate' },
  { value: 'generic', label: 'Generic' },
  { value: 'overproduced', label: 'Overproduced' },
  { value: 'educational', label: 'Preachy / lecture-like' },
  { value: 'influencer', label: 'Influencer-ish' },
  { value: 'ai_generated', label: 'AI-generated / sterile' },
  { value: 'too_serious', label: 'Too serious' },
  { value: 'too_casual', label: 'Too casual' },
];

export const FILMING_LOCATION_OPTIONS: readonly Option[] = [
  { value: 'home', label: 'At home' },
  { value: 'work', label: 'At work / office' },
  { value: 'school', label: 'At school / campus' },
  { value: 'outside', label: 'Outside / walking' },
  { value: 'anywhere', label: 'Anywhere with a phone' },
  { value: 'changes_daily', label: 'It changes every day' },
];

export const CAMERA_COMFORT_OPTIONS: readonly Option[] = [
  { value: 'talking_to_cam', label: 'Talking directly to camera' },
  { value: 'walking_moving', label: 'Walking / moving around' },
  { value: 'working_on_something', label: 'Working on something' },
  { value: 'demonstrating', label: 'Demonstrating something' },
  { value: 'voice_over', label: 'Voice-over with b-roll' },
  { value: 'hands_objects', label: 'Mostly hands / desk objects' },
  { value: 'mix_everything', label: 'A mix of everything' },
];

export const PRIMARY_GOAL_OPTIONS: readonly Option[] = [
  { value: 'reach', label: 'Reach & visibility' },
  { value: 'followers', label: 'Followers' },
  { value: 'customers', label: 'Customers / signups' },
  { value: 'leads', label: 'Inbound sales leads' },
  { value: 'authority', label: 'Industry authority' },
  { value: 'community', label: 'Building community' },
  { value: 'documenting', label: 'Documenting my journey' },
];

export const PREFERRED_CONTENT_TYPE_OPTIONS: readonly Option[] = [
  { value: 'opinions', label: 'Contrarian opinions' },
  { value: 'educational', label: 'Breakdowns & insights' },
  { value: 'founder_journey', label: 'Founder journey & raw truth' },
  { value: 'product_demos', label: 'Product & tech demos' },
  { value: 'stories', label: 'Anecdotes & stories' },
  { value: 'bts', label: 'Behind the scenes' },
  { value: 'entertainment', label: 'Humor & entertainment' },
  { value: 'mix', label: 'A mix of styles' },
];

export const TARGET_EMOTION_OPTIONS: readonly Option[] = [
  { value: 'curious', label: 'Curious' },
  { value: 'inspired', label: 'Inspired' },
  { value: 'surprised', label: 'Surprised' },
  { value: 'challenged', label: 'Challenged' },
  { value: 'entertained', label: 'Entertained' },
  { value: 'understood', label: 'Understood' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'excited', label: 'Excited' },
];

/** 3-Tier Output Structure */
export interface Tier1StableIdentity {
  buildingType: string;
  stage: string;
  buildingDescription: string;
  targetAudience: string;
  desiredAudienceThought: string;
  onePersonToReach: string;
  voiceStyle: string;
  challengeLevel: number;
  contrarianOpinion: string;
  associatedTraits: string[];
  antiFeelTraits: string[];
  rememberedVersion: string;
}

export interface Tier2ContentPreferences {
  filmingLocation: string;
  cameraComfort: string;
  dailyRoutineAction: string;
  primaryGoal: string;
  preferredContentType: string;
  successDefinition: string;
}

export interface Tier3CurrentContext {
  currentMessage: string;
  targetEmotion: string;
  oneVideoStatement: string;
}

export interface StructuredOnboardingResult {
  tier1_stable: Tier1StableIdentity;
  tier2_preferences: Tier2ContentPreferences;
  tier3_context: Tier3CurrentContext;
}

export function structureOnboardingData(raw: NewOnboardingData): StructuredOnboardingResult {
  return {
    tier1_stable: {
      buildingType: raw.buildingType,
      stage: raw.stage,
      buildingDescription: raw.buildingDescription,
      targetAudience: raw.targetAudience,
      desiredAudienceThought: raw.desiredAudienceThought,
      onePersonToReach: raw.onePersonToReach,
      voiceStyle: raw.voiceStyle,
      challengeLevel: typeof raw.challengeLevel === "number" && raw.challengeLevel <= 10 ? raw.challengeLevel * 10 : Math.min(100, Math.max(0, Number(raw.challengeLevel) || 50)),
      contrarianOpinion: raw.contrarianOpinion,
      associatedTraits: raw.associatedTraits,
      antiFeelTraits: raw.antiFeelTraits,
      rememberedVersion: raw.rememberedVersion,
    },
    tier2_preferences: {
      filmingLocation: raw.filmingLocation,
      cameraComfort: raw.cameraComfort,
      dailyRoutineAction: raw.dailyRoutineAction,
      primaryGoal: raw.primaryGoal,
      preferredContentType: raw.preferredContentType,
      successDefinition: raw.successDefinition,
    },
    tier3_context: {
      currentMessage: raw.currentMessage,
      targetEmotion: raw.targetEmotion,
      oneVideoStatement: raw.oneVideoStatement,
    },
  };
}
