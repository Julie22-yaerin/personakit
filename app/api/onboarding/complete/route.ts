import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth-guard';
import { enforceRateLimit } from '../../../../lib/rate-limit';
import { serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { z } from 'zod';

const Tier1Schema = z.object({
  buildingType: z.string().min(1),
  stage: z.string().min(1),
  buildingDescription: z.string().min(1),
  targetAudience: z.string().min(1),
  desiredAudienceThought: z.string().min(1),
  onePersonToReach: z.string().min(1),
  voiceStyle: z.string().min(1),
  challengeLevel: z.number().min(1).max(10),
  contrarianOpinion: z.string().min(1),
  associatedTraits: z.array(z.string()).min(1).max(2),
  antiFeelTraits: z.array(z.string()).min(1),
  rememberedVersion: z.string().min(1),
});

const Tier2Schema = z.object({
  filmingLocation: z.string().min(1),
  cameraComfort: z.string().min(1),
  dailyRoutineAction: z.string().min(1),
  primaryGoal: z.string().min(1),
  preferredContentType: z.string().min(1),
  successDefinition: z.string().min(1),
});

const Tier3Schema = z.object({
  currentMessage: z.string().min(1),
  targetEmotion: z.string().min(1),
  oneVideoStatement: z.string().min(1),
});

const CompleteRequestSchema = z.object({
  tier1_stable: Tier1Schema,
  tier2_preferences: Tier2Schema,
  tier3_context: Tier3Schema,
  personaVector: z.record(z.string(), z.number()).optional(),
  styleSuggestions: z.object({
    visual: z.string(),
    voice: z.string(),
    content: z.string(),
  }).optional(),
});

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const limited = enforceRateLimit(auth.uid, 'onboarding/complete', 10, 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = CompleteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { tier1_stable, tier2_preferences, tier3_context, personaVector, styleSuggestions } = parsed.data;
    const uid = auth.uid;

    await setDoc(
      doc(db, 'users', uid),
      {
        onboarding: {
          tier1_stable,
          tier2_preferences,
          tier3_context,
          completedAt: serverTimestamp(),
        },
        onboardingCompletedAt: serverTimestamp(),
      },
      { merge: true },
    );

    if (personaVector && styleSuggestions) {
      await setDoc(
        doc(db, 'personas', uid),
        {
          personaVector,
          styleSuggestions,
          tier1_stable,
          tier2_preferences,
          tier3_context,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[onboarding/complete] error', err);
    return NextResponse.json({ error: 'Failed to save onboarding' }, { status: 500 });
  }
}
