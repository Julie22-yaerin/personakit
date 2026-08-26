import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth-guard';
import { enforceRateLimit } from '../../../../lib/rate-limit';
import { serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { z } from 'zod';

const OnboardingSchema = z.object({
  founderType: z.string().min(1),
  traits: z.array(z.string()).min(1),
  oneSentence: z.string().min(1).max(200),
  perceptionGoals: z.array(z.string()).min(1).max(3),
  perceptionAntiGoals: z.array(z.string()).min(1).max(5),
  companyName: z.string().min(1).max(100),
  whatYouBuild: z.string().min(1).max(200),
  targetAudience: z.array(z.string()).min(1).max(3),
  brandPersonality: z.array(z.string()).min(2).max(3),
  primaryGoal: z.string().min(1),
  priorityRanking: z.array(z.string()).length(4),
  painPoints: z.array(z.string()).min(1),
  biggestBottleneck: z.string().min(1),
  timePerWeek: z.string().min(1),
  filmingComfort: z.number().min(1).max(5),
  editingWillingness: z.string().min(1),
  creationLocation: z.array(z.string()).min(1).max(3),
  thirtyDayGoal: z.string().min(1).max(300),
});

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const limited = enforceRateLimit(auth.uid, 'onboarding/complete', 5, 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = OnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const data = parsed.data;
    const uid = auth.uid;

    await setDoc(
      doc(db, 'users', uid),
      {
        onboarding: {
          identity: {
            founderType: data.founderType,
            traits: data.traits,
            oneSentence: data.oneSentence,
          },
          perception: {
            goals: data.perceptionGoals,
            antiGoals: data.perceptionAntiGoals,
          },
          company: {
            name: data.companyName,
            description: data.whatYouBuild,
            targetAudience: data.targetAudience,
            brandPersonality: data.brandPersonality,
          },
          contentGoals: {
            primary: data.primaryGoal,
            priorities: data.priorityRanking,
          },
          bottlenecks: {
            painPoints: data.painPoints,
            biggest: data.biggestBottleneck,
          },
          reality: {
            timePerWeek: data.timePerWeek,
            filmingComfort: data.filmingComfort,
            editingWillingness: data.editingWillingness,
            creationLocation: data.creationLocation,
          },
          destination: {
            thirtyDayGoal: data.thirtyDayGoal,
          },
          completedAt: serverTimestamp(),
        },
        onboardingCompletedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[onboarding/complete] error', err);
    return NextResponse.json({ error: 'Failed to save onboarding' }, { status: 500 });
  }
}