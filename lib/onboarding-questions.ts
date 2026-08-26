export interface Option {
  value: string;
  label: string;
}

export type FieldType = 'single-select' | 'multi-select' | 'text' | 'scale' | 'ranked-select';

export interface BaseField {
  key: keyof OnboardingData;
  label: string;
  type: FieldType;
  required: boolean;
  options?: readonly Option[];
  disabled?: boolean;
}

export interface SingleSelectField extends BaseField {
  type: 'single-select';
  options: readonly Option[];
}

export interface MultiSelectField extends BaseField {
  type: 'multi-select';
  options: readonly Option[];
  max?: number;
  min?: number;
}

export interface TextField extends BaseField {
  type: 'text';
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
}

export interface ScaleField extends BaseField {
  type: 'scale';
  min: number;
  max: number;
  labels: Record<number, string>;
}

export interface RankedSelectField extends BaseField {
  type: 'ranked-select';
  options: readonly Option[];
}

export type Field = SingleSelectField | MultiSelectField | TextField | ScaleField | RankedSelectField;

export type OnboardingStepId = 'you' | 'perception' | 'company' | 'goals' | 'bottlenecks' | 'reality' | 'destination';

export interface OnboardingStep {
  id: OnboardingStepId;
  title: string;
  subtitle: string;
  fields: readonly Field[];
}

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: 'you',
    title: 'WHO ARE YOU?',
    subtitle: 'Tell us about yourself.',
    fields: [
      {
        key: 'founderType',
        label: 'What best describes you?',
        type: 'single-select',
        required: true,
        options: [
          { value: 'founder', label: 'Founder' },
          { value: 'cofounder', label: 'Co-founder' },
          { value: 'solo', label: 'Solo founder' },
          { value: 'creator', label: 'Creator → building a company' },
          { value: 'team', label: 'Startup team' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        key: 'traits',
        label: 'What are you like?',
        type: 'multi-select',
        required: true,
        max: 5,
        options: [
          { value: 'analytical', label: 'Analytical' },
          { value: 'ambitious', label: 'Ambitious' },
          { value: 'funny', label: 'Funny' },
          { value: 'opinionated', label: 'Opinionated' },
          { value: 'introverted', label: 'Introverted' },
          { value: 'chaotic', label: 'Chaotic' },
          { value: 'calm', label: 'Calm' },
          { value: 'experimental', label: 'Experimental' },
          { value: 'technical', label: 'Technical' },
          { value: 'creative', label: 'Creative' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        key: 'oneSentence',
        label: 'One sentence about you:',
        type: 'text',
        required: true,
        placeholder: "I'm a ___ building ___.",
        maxLength: 200,
      },
    ],
  },
  {
    id: 'perception',
    title: 'HOW DO YOU WANT TO BE PERCEIVED?',
    subtitle: 'When people see your content, what should they think?',
    fields: [
      {
        key: 'perceptionGoals',
        label: 'Choose up to 3:',
        type: 'multi-select',
        required: true,
        max: 3,
        options: [
          { value: 'smart', label: 'Smart' },
          { value: 'ambitious', label: 'Ambitious' },
          { value: 'funny', label: 'Funny' },
          { value: 'trustworthy', label: 'Trustworthy' },
          { value: 'experimental', label: 'Experimental' },
          { value: 'bold', label: 'Bold' },
          { value: 'sophisticated', label: 'Sophisticated' },
          { value: 'relatable', label: 'Relatable' },
          { value: 'technical', label: 'Technical' },
          { value: 'creative', label: 'Creative' },
          { value: 'controversial', label: 'Controversial' },
          { value: 'calm', label: 'Calm' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        key: 'perceptionAntiGoals',
        label: 'What should you NEVER come across as?',
        type: 'multi-select',
        required: true,
        max: 5,
        options: [
          { value: 'corporate', label: 'Corporate' },
          { value: 'cringe', label: 'Cringe' },
          { value: 'salesy', label: 'Salesy' },
          { value: 'fake', label: 'Fake' },
          { value: 'influencer', label: 'Influencer' },
          { value: 'too-serious', label: 'Too serious' },
          { value: 'too-polished', label: 'Too polished' },
          { value: 'generic', label: 'Generic' },
          { value: 'other', label: 'Other' },
        ],
      },
    ],
  },
  {
    id: 'company',
    title: 'WHAT ARE YOU BUILDING?',
    subtitle: 'Tell us about your company.',
    fields: [
      {
        key: 'companyName',
        label: 'Company name',
        type: 'text',
        required: true,
        placeholder: 'Acme Inc.',
        maxLength: 100,
      },
      {
        key: 'whatYouBuild',
        label: 'What do you build?',
        type: 'text',
        required: true,
        placeholder: 'We help ___ do ___.',
        maxLength: 200,
      },
      {
        key: 'targetAudience',
        label: 'Who is it for?',
        type: 'multi-select',
        required: true,
        max: 3,
        options: [
          { value: 'founders', label: 'Founders' },
          { value: 'students', label: 'Students' },
          { value: 'developers', label: 'Developers' },
          { value: 'designers', label: 'Designers' },
          { value: 'marketers', label: 'Marketers' },
          { value: 'investors', label: 'Investors' },
          { value: 'enterprises', label: 'Enterprises' },
          { value: 'creators', label: 'Creators' },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        key: 'brandPersonality',
        label: 'Brand personality (pick 2–3):',
        type: 'multi-select',
        required: true,
        max: 3,
        min: 2,
        options: [
          { value: 'minimal', label: 'Minimal' },
          { value: 'playful', label: 'Playful' },
          { value: 'premium', label: 'Premium' },
          { value: 'bold', label: 'Bold' },
          { value: 'technical', label: 'Technical' },
          { value: 'friendly', label: 'Friendly' },
          { value: 'rebellious', label: 'Rebellious' },
          { value: 'serious', label: 'Serious' },
          { value: 'weird', label: 'Weird' },
        ],
      },
    ],
  },
  {
    id: 'goals',
    title: 'WHAT DO YOU WANT CONTENT TO DO?',
    subtitle: "What's the job of your content?",
    fields: [
      {
        key: 'primaryGoal',
        label: 'Primary goal:',
        type: 'single-select',
        required: true,
        options: [
          { value: 'customers', label: 'Get customers' },
          { value: 'founder-recognition', label: 'Build founder recognition' },
          { value: 'leads', label: 'Generate leads' },
          { value: 'community', label: 'Build community' },
          { value: 'awareness', label: 'Raise awareness' },
          { value: 'investors', label: 'Attract investors' },
          { value: 'recruit', label: 'Recruit talent' },
          { value: 'positioning', label: 'Test positioning' },
        ],
      },
      {
        key: 'priorityRanking',
        label: 'What matters most right now? Rank them:',
        type: 'ranked-select',
        required: true,
        options: [
          { value: 'customers', label: 'Customers' },
          { value: 'reach', label: 'Reach' },
          { value: 'followers', label: 'Followers' },
          { value: 'authority', label: 'Authority' },
        ],
      },
    ],
  },
  {
    id: 'bottlenecks',
    title: "WHAT'S STOPPING YOU?",
    subtitle: 'What\'s currently making content hard?',
    fields: [
      {
        key: 'painPoints',
        label: 'Select all that apply:',
        type: 'multi-select',
        required: true,
        options: [
          { value: 'dont-know-what-to-post', label: "I don't know what to post" },
          { value: 'dont-know-what-to-say', label: "I don't know what to say" },
          { value: 'filming-too-long', label: 'Filming takes too long' },
          { value: 'editing-too-long', label: 'Editing takes too long' },
          { value: 'hate-camera', label: "I hate being on camera" },
          { value: 'dont-know-how-to-sell', label: "I don't know how to sell without sounding salesy" },
          { value: 'views-no-customers', label: 'My content gets views but no customers' },
          { value: 'not-enough-views', label: "I don't get enough views" },
          { value: 'cant-post-consistently', label: "I can't post consistently" },
          { value: 'dont-know-audience', label: "I don't know who I'm talking to" },
          { value: 'content-feels-generic', label: 'My content feels generic' },
          { value: 'dont-know-what-works', label: "I don't know what works" },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        key: 'biggestBottleneck',
        label: 'What\'s your BIGGEST bottleneck? (Pick ONE)',
        type: 'single-select',
        required: true,
        options: [],
      },
    ],
  },
  {
    id: 'reality',
    title: 'YOUR REALITY',
    subtitle: 'How much can you realistically create?',
    fields: [
      {
        key: 'timePerWeek',
        label: 'Time per week:',
        type: 'single-select',
        required: true,
        options: [
          { value: 'lt1', label: '< 1 hour' },
          { value: '1-3', label: '1–3 hours' },
          { value: '3-5', label: '3–5 hours' },
          { value: '5-10', label: '5–10 hours' },
          { value: '10plus', label: '10+ hours' },
        ],
      },
      {
        key: 'filmingComfort',
        label: 'How comfortable are you with filming?',
        type: 'scale',
        required: true,
        min: 1,
        max: 5,
        labels: { 1: 'Terrified', 3: 'Okay', 5: 'Love it' },
      },
      {
        key: 'editingWillingness',
        label: 'How much editing are you willing to do?',
        type: 'single-select',
        required: true,
        options: [
          { value: 'none', label: 'Almost none' },
          { value: 'light', label: 'Light editing' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'whatever', label: "I don't care" },
        ],
      },
      {
        key: 'creationLocation',
        label: 'Where do you usually create?',
        type: 'multi-select',
        required: true,
        max: 3,
        options: [
          { value: 'bedroom', label: 'Bedroom' },
          { value: 'office', label: 'Office' },
          { value: 'school', label: 'School' },
          { value: 'outside', label: 'Outside' },
          { value: 'studio', label: 'Studio' },
          { value: 'anywhere', label: 'Anywhere' },
        ],
      },
    ],
  },
  {
    id: 'destination',
    title: '30-DAY TARGET',
    subtitle: 'If this works, what do you want to happen in the next 30 days?',
    fields: [
      {
        key: 'thirtyDayGoal',
        label: '',
        type: 'text',
        required: true,
        placeholder: 'I want to get my first 20 customers.',
        maxLength: 300,
      },
    ],
  },
] as const;

export type OnboardingData = {
  founderType: string;
  traits: string[];
  oneSentence: string;
  perceptionGoals: string[];
  perceptionAntiGoals: string[];
  companyName: string;
  whatYouBuild: string;
  targetAudience: string[];
  brandPersonality: string[];
  primaryGoal: string;
  priorityRanking: string[];
  painPoints: string[];
  biggestBottleneck: string;
  timePerWeek: string;
  filmingComfort: number;
  editingWillingness: string;
  creationLocation: string[];
  thirtyDayGoal: string;
};

export const STEP_ORDER: OnboardingStepId[] = [
  'you',
  'perception',
  'company',
  'goals',
  'bottlenecks',
  'reality',
  'destination',
];

export function getStepById(id: OnboardingStepId) {
  return ONBOARDING_STEPS.find((s) => s.id === id);
}

export function getNextStepId(currentId: OnboardingStepId): OnboardingStepId | null {
  const idx = STEP_ORDER.indexOf(currentId);
  if (idx === -1 || idx === STEP_ORDER.length - 1) return null;
  return STEP_ORDER[idx + 1];
}

export function getPrevStepId(currentId: OnboardingStepId): OnboardingStepId | null {
  const idx = STEP_ORDER.indexOf(currentId);
  if (idx <= 0) return null;
  return STEP_ORDER[idx - 1];
}

export function getStepProgress(currentId: OnboardingStepId): { current: number; total: number; percent: number } {
  const idx = STEP_ORDER.indexOf(currentId);
  const current = idx + 1;
  const total = STEP_ORDER.length;
  return { current, total, percent: Math.round((current / total) * 100) };
}