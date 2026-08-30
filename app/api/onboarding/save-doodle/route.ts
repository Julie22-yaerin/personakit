import { NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/auth-guard';
import { enforceRateLimit } from '../../../../lib/rate-limit';
import { serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { z } from 'zod';

const RequestSchema = z.object({
  doodleUrl: z.string().min(1),
});

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const limited = enforceRateLimit(auth.uid, 'onboarding/save-doodle', 10, 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { doodleUrl } = parsed.data;
    const uid = auth.uid;

    // Save to users collection
    await setDoc(
      doc(db, 'users', uid),
      {
        doodleUrl,
        doodleUpdatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    // Save to personas collection
    await setDoc(
      doc(db, 'personas', uid),
      {
        doodleUrl,
      },
      { merge: true },
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[onboarding/save-doodle] error', err);
    return NextResponse.json({ error: 'Failed to save doodle' }, { status: 500 });
  }
}
