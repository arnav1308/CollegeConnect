import { NextRequest, NextResponse } from 'next/server';

export interface CollegeRecommendation {
  collegeName: string;
  branch: string;
  type: 'Public' | 'Private';
  feasibility: 'Safe' | 'Competitive' | 'Borderline';
  aiMatchScore: number;
  holisticReview: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const examPathway = body.examPathway || body.exam_name || 'JEE Main';
    const rank = body.rank ? Number(body.rank) : 15000;
    const category = body.category || body.seat_category || 'OPEN';
    const primaryBranch = body.primaryBranch || 'Computer Science and Engineering (CSE)';
    const secondaryBranch = body.secondaryBranch || 'Information Technology (IT)';

    const geminiSystemPrompt = `
You are an expert Indian engineering college counselor. The user took the ${examPathway} and secured a rank/score of ${rank}, category: ${category}, and prefers these branches: 1) ${primaryBranch}, 2) ${secondaryBranch}.

CRITICAL ELIGIBILITY RULE: You must act as a strict mathematical filter first. If the user's rank is mathematically HIGHER (i.e., worse) than a college's historical closing rank, they CANNOT get in. You must absolutely NOT recommend elite options like IIT Bombay CSE or NIT Trichy CSE to a user with a rank of 12,000.

Use this generalized 2026 rank reference tier list (Open/General category) to find valid options:

* Rank 1 - 1,500: IIT Bombay/Delhi/Madras (CSE/EE), NIT Trichy/Surathkal (CSE).
* Rank 1,500 - 5,000: Top IITs (Core), Top NITs (IT/ECE), IIIT Hyderabad, BITS Pilani (CSE).
* Rank 5,000 - 15,000: Mid-tier NITs CSE (NIT Jalandhar, NIT Bhopal), Top NITs Mechanical (e.g., NIT Surathkal Mech), IIIT Delhi/Allahabad (IT/ECE), BITS Pilani (Circuital), VIT Vellore (CSE Cat 1/2), LNMIIT (CSE), Thapar (CSE).
* Rank 15,000 - 30,000: Lower NITs (CSE), Mid NITs (Core branches), Manipal (Main Campus CSE), SRM (KTR CSE), JIIT Noida (CSE).
* Rank 30,000 - 80,000: State Govt colleges, VIT/SRM/Manipal (Lower campuses/categories), KIIT, Jaypee (ECE/IT).
* Rank 80,000+: Accessible private options, specialized regional colleges.

Your task: Recommend the TOP 5 most suitable colleges where the user is ACTUALLY mathematically eligible based on the reference above. Include a mix of public and private colleges.

Analyze the valid options and rank them holistically based on the user's preferred branches, coding culture, faculty behavior, student clubs, and placement data. The most culturally enriching and logically eligible options should be at the top.

You must adhere strictly to this JSON schema for each object in the array:
{
"collegeName": "String (e.g., JIIT Noida or NIT Jalandhar)",
"branch": "String",
"type": "Public | Private",
"feasibility": "Safe | Competitive | Borderline",
"aiMatchScore": "Number between 1 and 100",
"holisticReview": "A 3-sentence summary detailing campus life, faculty behavior, student clubs, and placements."
}
Do not return any markdown formatting like \`\`\`json. Return only the raw array.
`;

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      const candidateModels = [
        'gemini-2.5-flash',
        'gemini-1.5-flash',
        'gemini-2.0-flash',
        'gemini-flash-latest',
      ];

      for (const model of candidateModels) {
        try {
          const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const geminiResponse = await fetch(geminiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: geminiSystemPrompt }],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: 'application/json',
              },
            }),
          });

          clearTimeout(timeoutId);

          if (geminiResponse.ok) {
            const geminiData = await geminiResponse.json();
            const rawContent = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (rawContent) {
              const cleanedJson = rawContent
                .replace(/```json/gi, '')
                .replace(/```/g, '')
                .trim();

              const parsedRecommendations: CollegeRecommendation[] = JSON.parse(cleanedJson);

              const formatted = parsedRecommendations.map((item) => ({
                ...item,
                aiMatchScore: Number(item.aiMatchScore) || 85,
              }));

              return NextResponse.json(formatted, { status: 200 });
            }
          }
        } catch {
        }
      }
    }

    const fallbackRecommendations: CollegeRecommendation[] = getTierAccurateRecommendations(
      rank,
      primaryBranch,
      secondaryBranch
    );

    return NextResponse.json(fallbackRecommendations, { status: 200 });
  } catch (err: any) {
    console.error('[Admissions Engine Unhandled Exception]:', err);
    return NextResponse.json(
      { error: 'Failed to generate college recommendations', details: err?.message },
      { status: 500 }
    );
  }
}

function getTierAccurateRecommendations(
  rank: number,
  primaryBranch: string,
  secondaryBranch: string
): CollegeRecommendation[] {
  const pBranch = primaryBranch === 'Any' ? 'Computer Science and Engineering (CSE)' : primaryBranch;
  const sBranch = secondaryBranch === 'Any' ? 'Information Technology (IT)' : secondaryBranch;

  if (rank <= 1500) {
    return [
      {
        collegeName: 'IIT Bombay',
        branch: pBranch,
        type: 'Public',
        feasibility: 'Competitive',
        aiMatchScore: 98,
        holisticReview:
          'Peer cohort consists of the nation top rankers with active student tech councils and world-class algorithmic coding clubs. Professors maintain intense academic rigor and evaluate students through deep laboratory research projects. Campus placement statistics break national records with direct recruitment from high-frequency trading and Silicon Valley giants.',
      },
      {
        collegeName: 'IIT Delhi',
        branch: sBranch,
        type: 'Public',
        feasibility: 'Safe',
        aiMatchScore: 95,
        holisticReview:
          'Located in the capital tech corridor with exceptional inter-college hackathons and a vibrant startup incubation cell. Faculty encourage independent multidisciplinary research while supporting flexible credit electives. Consistently records near 100% placement conversions with industry-leading median salaries.',
      },
      {
        collegeName: 'NIT Trichy',
        branch: pBranch,
        type: 'Public',
        feasibility: 'Safe',
        aiMatchScore: 93,
        holisticReview:
          'Top-ranked NIT known for its prestigious Festember cultural festival and highly active technical societies. Faculty are seasoned researchers with strong industrial consulting collaborations. Placement drives attract every major global tech company with strong alumni support.',
      },
      {
        collegeName: 'NIT Surathkal',
        branch: sBranch,
        type: 'Public',
        feasibility: 'Safe',
        aiMatchScore: 90,
        holisticReview:
          'Scenic coastal campus with balanced sports culture and renowned robotics teams. Senior professors prioritize hands-on systems programming over traditional rote learning. High placement packages with extensive software and core engineering recruitment.',
      },
      {
        collegeName: 'BITS Pilani (Pilani Campus)',
        branch: pBranch,
        type: 'Private',
        feasibility: 'Competitive',
        aiMatchScore: 94,
        holisticReview:
          'Unique zero-attendance policy empowers students to build startups and participate in global hackathons freely. Faculty are student-centric and actively mentor undergraduate research publications. Its Practice School internship program leads to exceptionally high pre-placement conversion rates.',
      },
    ];
  }

  if (rank <= 5000) {
    return [
      {
        collegeName: 'IIIT Hyderabad',
        branch: pBranch,
        type: 'Public',
        feasibility: 'Borderline',
        aiMatchScore: 96,
        holisticReview:
          'Widely recognized as India most intensive coding institute with curriculum starting with algorithms from week one. Professors are leading international researchers in NLP, computer vision, and robotics. Top-tier domestic and overseas placement offers consistently surpass even older IIT medians.',
      },
      {
        collegeName: 'NIT Trichy',
        branch: sBranch,
        type: 'Public',
        feasibility: 'Competitive',
        aiMatchScore: 91,
        holisticReview:
          'Excellent coding culture supported by established student technical chapters and computing facilities. Faculty provide extensive academic guidance for competitive GATE and international study aspirants. Premier tech companies prioritize this campus for high-remuneration core software roles.',
      },
      {
        collegeName: 'BITS Pilani (Goa Campus)',
        branch: pBranch,
        type: 'Private',
        feasibility: 'Safe',
        aiMatchScore: 89,
        holisticReview:
          'Modern campus with an energetic student community and thriving open-source development groups. Academic instructors foster collaborative group projects and supportive grading standards. Placements benefit from a unified centralized BITS recruitment drive across all branches.',
      },
      {
        collegeName: 'NIT Surathkal',
        branch: 'Electronics and Communication Engineering (ECE)',
        type: 'Public',
        feasibility: 'Safe',
        aiMatchScore: 87,
        holisticReview:
          'Renowned semiconductor and DSP laboratories coupled with an active hardware hackathon society. Experienced faculty emphasize embedded hardware design alongside firmware development. Consistent visits from major microchip designers and software multinationals.',
      },
      {
        collegeName: 'IIT Roorkee',
        branch: 'Mechanical Engineering',
        type: 'Public',
        feasibility: 'Safe',
        aiMatchScore: 84,
        holisticReview:
          'Historic institution with sprawling sports facilities and an active Formula Student engineering racing team. Faculty maintain world-class mechanical prototyping labs and industrial tie-ups. Core engineering and quantitative finance placement profiles recruit heavily from this branch.',
      },
    ];
  }

  if (rank <= 15000) {
    return [
      {
        collegeName: 'NIT Jalandhar',
        branch: pBranch,
        type: 'Public',
        feasibility: 'Competitive',
        aiMatchScore: 90,
        holisticReview:
          'Active regional coding groups and enthusiastic student hackathon culture provide strong peer learning. The faculty are supportive and provide dedicated mentoring for both software and gate preparation. Tech placements are consistently robust with prominent product companies recruiting on campus.',
      },
      {
        collegeName: 'NIT Bhopal (MANIT)',
        branch: pBranch,
        type: 'Public',
        feasibility: 'Borderline',
        aiMatchScore: 87,
        holisticReview:
          'Large residential campus with diverse technical societies, robotics clubs, and cultural festivals. Professors emphasize practical assignments and laboratory demonstrations over pure theory. Strong placement track record with substantial participation from IT product and financial tech firms.',
      },
      {
        collegeName: 'VIT Vellore',
        branch: pBranch,
        type: 'Private',
        feasibility: 'Safe',
        aiMatchScore: 91,
        holisticReview:
          'Vibrant student council environment with numerous technical chapters, gaming leagues, and hackathons. Faculty are approachable and maintain strict adherence to standardized evaluation benchmarks. Placement drives host hundreds of recruiters resulting in massive volume with high category-1 salary packages.',
      },
      {
        collegeName: 'LNMIIT Jaipur',
        branch: sBranch,
        type: 'Private',
        feasibility: 'Safe',
        aiMatchScore: 88,
        holisticReview:
          'Renowned for its rigorous coding culture with exceptional performance in ACM-ICPC and Google Summer of Code. Instructors maintain high academic standards modeled directly on premier IIT curricula. Stellar placement statistics with strong median packages across top software engineering roles.',
      },
      {
        collegeName: 'NIT Surathkal',
        branch: 'Mechanical Engineering',
        type: 'Public',
        feasibility: 'Safe',
        aiMatchScore: 85,
        holisticReview:
          'Offers the prestige and campus exposure of a premier national institute while studying core engineering. Professors are distinguished industrial consultants with access to advanced testing labs. Graduates enjoy broad flexibility for software, core manufacturing, and consulting placements.',
      },
    ];
  }

  if (rank <= 30000) {
    return [
      {
        collegeName: 'JIIT Noida (Sector 62)',
        branch: pBranch,
        type: 'Private',
        feasibility: 'Competitive',
        aiMatchScore: 89,
        holisticReview:
          'Prime NCR location ensures close industry integration with frequent guest workshops and tech meetups. Faculty enforce structured programming regimens with modern web and algorithms courses. Excellent placement statistics driven by immediate proximity to Gurgaon and Noida corporate hubs.',
      },
      {
        collegeName: 'MIT Manipal (Main Campus)',
        branch: sBranch,
        type: 'Private',
        feasibility: 'Safe',
        aiMatchScore: 88,
        holisticReview:
          'World-class student life featuring premier student project teams like Formula Manipal and Project Dronaid. Professors encourage innovation and maintain an open-door policy for undergraduate research. High-quality placement ecosystem attracting top consumer tech and multinational companies.',
      },
      {
        collegeName: 'SRM Institute (KTR Main Campus)',
        branch: pBranch,
        type: 'Private',
        feasibility: 'Safe',
        aiMatchScore: 84,
        holisticReview:
          'Massive student diversity with numerous specialized technical clubs spanning AI, web3, and electric mobility. Faculty offer flexible honors specializations alongside traditional curriculum tracks. Extensive recruitment seasons featuring marquee dream companies and diverse software offers.',
      },
      {
        collegeName: 'NIT Hamirpur',
        branch: 'Civil Engineering',
        type: 'Public',
        feasibility: 'Safe',
        aiMatchScore: 80,
        holisticReview:
          'Picturesque Himalayan campus providing clean, focused academic surroundings and enthusiastic sports clubs. Faculty are experienced researchers in structural and environmental engineering disciplines. Regular visits from government infra agencies, PSU contractors, and software recruiters.',
      },
      {
        collegeName: 'Thapar Institute (DERA)',
        branch: sBranch,
        type: 'Private',
        feasibility: 'Safe',
        aiMatchScore: 86,
        holisticReview:
          'Vibrant student community with rich campus traditions and active experiential learning programs. Faculty have extensive industry backgrounds and encourage collaborative capstone design work. Strong placement records backed by decades of well-placed alumni in tier-1 tech firms.',
      },
    ];
  }

  return [
    {
      collegeName: 'KIIT Bhubaneswar',
      branch: pBranch,
      type: 'Private',
      feasibility: 'Safe',
      aiMatchScore: 85,
      holisticReview:
        'Expansive modern campus equipped with extensive sports arenas, cultural societies, and technical clubs. Instructors are supportive and prioritize student career readiness and skill certifications. Strong day-one placement drives ensure high offer volume across major IT consulting firms.',
    },
    {
      collegeName: 'Jaypee University (JUET Guna / Sector 128)',
      branch: sBranch,
      type: 'Private',
      feasibility: 'Safe',
      aiMatchScore: 83,
      holisticReview:
        'Peaceful academic setting with well-structured computer labs and peer-driven coding groups. Faculty emphasize foundational data structures and clear project deliverables. Benefits from centralized JIIT placement pooling across NCR software recruiters.',
    },
    {
      collegeName: 'Nirma University',
      branch: pBranch,
      type: 'Private',
      feasibility: 'Competitive',
      aiMatchScore: 81,
      holisticReview:
        'Disciplined academic environment with strong robotics and industrial automation clubs. Faculty maintain close links with regional manufacturing and technological enterprise hubs. Consistent placement record with balanced software and core engineering recruitment drives.',
    },
    {
      collegeName: 'MIT World Peace University (Pune)',
      branch: sBranch,
      type: 'Private',
      feasibility: 'Safe',
      aiMatchScore: 79,
      holisticReview:
        'Centrally located in Pune student hub with abundant cultural activities, seminars, and hackathons. Teachers support multidisciplinary design electives and co-curricular projects. Proximity to Pune Hinjewadi IT parks guarantees steady software recruiting opportunities.',
    },
    {
      collegeName: 'UPES Dehradun',
      branch: pBranch,
      type: 'Private',
      feasibility: 'Safe',
      aiMatchScore: 76,
      holisticReview:
        'Scenic valley campus offering industry-aligned computer science tracks and active student chapters. Faculty collaborate with corporate partners to embed practical cloud certifications. Solid placement support with growing recruitment across cloud engineering and IT consultancies.',
    },
  ];
}
