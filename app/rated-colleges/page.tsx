import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/session';
import db from '@/lib/db';
import RatedCollegesView from '@/components/RatedCollegesView';
import { aggregateRatingsList } from '@/lib/canonical';

export const dynamic = 'force-dynamic';

export default async function RatedCollegesPage() {
  const session = await getServerSession();

  if (!session || !session.userId) {
    redirect('/login?redirectedFrom=/rated-colleges');
  }

  if (session.role !== 'applicant') {
    redirect('/inbox');
  }

  const rawRows = db.prepare('SELECT * FROM ratings').all() as any[];
  const colleges = aggregateRatingsList(rawRows);

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950">
      <RatedCollegesView initialColleges={colleges} />
    </main>
  );
}
