import { redirect } from 'next/navigation';
import { getDemoSession } from '@/lib/auth';
import { AdmissionsDashboard } from '@/components/AdmissionsDashboard';

export default async function AdmissionsPage() {
  const session = await getDemoSession();

  if (!session) {
    redirect('/login?redirectedFrom=/admissions');
  }

  return (
    <main className="flex-1">
      <AdmissionsDashboard userAuthToken={session.userId} />
    </main>
  );
}
