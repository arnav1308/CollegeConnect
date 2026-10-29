import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/session';
import db from '@/lib/db';
import RatedCollegesView, { type RatedCollegeItem } from '@/components/RatedCollegesView';

export const dynamic = 'force-dynamic';

export default async function RatedCollegesPage() {
  const session = await getServerSession();

  if (!session || !session.userId) {
    redirect('/login?redirectedFrom=/rated-colleges');
  }

  if (session.role !== 'applicant') {
    redirect('/inbox');
  }

  const query = `
    SELECT 
      college as collegeName,
      COUNT(id) as total_reviews,
      ROUND(AVG(overall), 1) as overall,
      ROUND(AVG(academics), 1) as academics,
      ROUND(AVG(faculty), 1) as faculty,
      ROUND(AVG(placements), 1) as placements,
      ROUND(AVG(internships), 1) as internships,
      ROUND(AVG(hostel), 1) as hostel,
      ROUND(AVG(mess), 1) as mess,
      ROUND(AVG(campus_life), 1) as campus_life,
      ROUND(AVG(peer_group), 1) as peer_group,
      ROUND(AVG(infrastructure), 1) as infrastructure,
      ROUND(AVG(clubs), 1) as clubs,
      ROUND(AVG(fests), 1) as fests,
      ROUND(AVG(coding_culture), 1) as coding_culture,
      ROUND(AVG(sports), 1) as sports,
      ROUND(AVG(administration), 1) as administration,
      ROUND(AVG(fees), 1) as fees,
      ROUND(AVG(location), 1) as location,
      ROUND(AVG(safety), 1) as safety
    FROM ratings
    GROUP BY college
    ORDER BY overall DESC
  `;

  const colleges = db.prepare(query).all() as RatedCollegeItem[];

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950">
      <RatedCollegesView initialColleges={colleges} />
    </main>
  );
}

