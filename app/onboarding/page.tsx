"use client";

import { useRouter } from 'next/navigation';
import OnboardingFlow from './OnboardingFlow';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace('/login');
        return;
      }
      const snap = await getDoc(doc(db, 'users', u.uid));
      if (snap.exists() && snap.data().onboardingCompletedAt) {
        router.replace('/app');
        return;
      }
    });
  }, [router]);

  return <OnboardingFlow />;
}