export interface AggregatedCollegeRatings {
  collegeName: string;
  total_reviews: number;
  overall: number;
  academics: number;
  faculty: number;
  placements: number;
  internships: number;
  hostel: number;
  mess: number;
  campus_life: number;
  peer_group: number;
  infrastructure: number;
  clubs: number;
  fests: number;
  coding_culture: number;
  sports: number;
  administration: number;
  fees: number;
  location: number;
  safety: number;
}

interface RawRatingRow {
  id: number;
  senior_id: string;
  college: string;
  academics: number;
  faculty: number;
  placements: number;
  internships: number;
  hostel: number;
  mess: number;
  campus_life: number;
  peer_group: number;
  infrastructure: number;
  clubs: number;
  fests: number;
  coding_culture: number;
  sports: number;
  administration: number;
  fees: number;
  location: number;
  safety: number;
  overall: number;
}

export function getCanonicalCollegeName(rawName: string): string {
  if (!rawName) return '';
  const trimmed = rawName.trim();
  const lower = trimmed.toLowerCase();

  if (
    lower.includes('bombay') ||
    lower.includes('iitb') ||
    lower === 'iit bombay' ||
    lower === 'indian institute of technology bombay' ||
    lower === 'indian institute of technology, bombay'
  ) {
    return 'IIT Bombay';
  }

  if (
    (lower.includes('delhi') && (lower.includes('iit') || lower.includes('technology'))) ||
    lower.includes('iitd') ||
    lower === 'iit delhi' ||
    lower === 'indian institute of technology delhi' ||
    lower === 'indian institute of technology, delhi'
  ) {
    return 'IIT Delhi';
  }

  if (
    lower.includes('roorkee') ||
    lower.includes('iitr') ||
    lower === 'iit roorkee'
  ) {
    return 'IIT Roorkee';
  }

  if (
    lower.includes('trichy') ||
    lower.includes('tiruchirappalli') ||
    lower.includes('nitt') ||
    lower === 'nit trichy' ||
    lower === 'national institute of technology tiruchirappalli' ||
    lower === 'national institute of technology, tiruchirappalli'
  ) {
    return 'NIT Trichy';
  }

  if (
    lower.includes('surathkal') ||
    (lower.includes('karnataka') && lower.includes('nit')) ||
    lower.includes('nitk') ||
    lower === 'nit surathkal'
  ) {
    return 'NIT Surathkal';
  }

  if (
    lower.includes('jalandhar') ||
    lower.includes('nitj') ||
    lower === 'nit jalandhar'
  ) {
    return 'NIT Jalandhar';
  }

  if (
    lower.includes('manit') ||
    (lower.includes('bhopal') && lower.includes('nit')) ||
    lower === 'nit bhopal' ||
    lower === 'nit bhopal (manit)'
  ) {
    return 'NIT Bhopal (MANIT)';
  }

  if (
    lower.includes('hamirpur') ||
    lower.includes('nith') ||
    lower === 'nit hamirpur'
  ) {
    return 'NIT Hamirpur';
  }

  if (
    (lower.includes('hyderabad') && (lower.includes('iiit') || lower.includes('international institute'))) ||
    lower === 'iiit hyderabad' ||
    lower === 'iiith'
  ) {
    return 'IIIT Hyderabad';
  }

  if (
    lower.includes('bits') ||
    lower.includes('birla institute of technology and science')
  ) {
    if (lower.includes('goa')) return 'BITS Pilani (Goa Campus)';
    if (lower.includes('hyderabad')) return 'BITS Pilani (Hyderabad Campus)';
    return 'BITS Pilani (Pilani Campus)';
  }

  if (
    lower.includes('vellore') ||
    lower.includes('vit vellore') ||
    lower === 'vit'
  ) {
    return 'VIT Vellore';
  }

  if (
    lower.includes('manipal') &&
    (lower.includes('technology') || lower.includes('mit'))
  ) {
    return 'MIT Manipal (Main Campus)';
  }

  if (
    lower.includes('jaypee') ||
    lower.includes('jiit')
  ) {
    if (lower.includes('guna') || lower.includes('128') || lower.includes('juet')) {
      return 'Jaypee University (JUET Guna / Sector 128)';
    }
    return 'Jaypee Institute of Information Technology';
  }

  if (
    lower.includes('thapar') ||
    lower.includes('tiet')
  ) {
    return 'Thapar Institute (DERA)';
  }

  if (lower.includes('lnmiit')) {
    return 'LNMIIT Jaipur';
  }

  if (lower.includes('srm')) {
    return 'SRM Institute (KTR Main Campus)';
  }

  if (lower.includes('kiit')) {
    return 'KIIT Bhubaneswar';
  }

  if (lower.includes('upes')) {
    return 'UPES Dehradun';
  }

  if (lower.includes('nirma')) {
    return 'Nirma University';
  }

  return trimmed;
}

export function aggregateRatingsList(rawRows: RawRatingRow[]): AggregatedCollegeRatings[] {
  const grouped: Record<string, RawRatingRow[]> = {};

  for (const row of rawRows) {
    const canonical = getCanonicalCollegeName(row.college);
    if (!grouped[canonical]) {
      grouped[canonical] = [];
    }
    grouped[canonical].push(row);
  }

  const results: AggregatedCollegeRatings[] = Object.entries(grouped).map(([collegeName, items]) => {
    const count = items.length;
    const calcAvg = (key: keyof RawRatingRow) => {
      const sum = items.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0);
      return Number((sum / count).toFixed(1));
    };

    return {
      collegeName,
      total_reviews: count,
      overall: calcAvg('overall'),
      academics: calcAvg('academics'),
      faculty: calcAvg('faculty'),
      placements: calcAvg('placements'),
      internships: calcAvg('internships'),
      hostel: calcAvg('hostel'),
      mess: calcAvg('mess'),
      campus_life: calcAvg('campus_life'),
      peer_group: calcAvg('peer_group'),
      infrastructure: calcAvg('infrastructure'),
      clubs: calcAvg('clubs'),
      fests: calcAvg('fests'),
      coding_culture: calcAvg('coding_culture'),
      sports: calcAvg('sports'),
      administration: calcAvg('administration'),
      fees: calcAvg('fees'),
      location: calcAvg('location'),
      safety: calcAvg('safety'),
    };
  });

  results.sort((a, b) => b.overall - a.overall || b.total_reviews - a.total_reviews);
  return results;
}
