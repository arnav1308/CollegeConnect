# CollegeConnect

> Find your college. Know its reality.

CollegeConnect is a modern discovery and counseling platform that helps engineering aspirants find the right college through deterministic rank boundaries, holistic AI matching, and direct 1-on-1 anonymous connections with verified campus seniors.

---

## The Problem & The Solution

### The Problem
The Indian engineering college discovery process is fundamentally broken:
- **Fragmented Data:** Cutoff marks, closing ranks, and eligibility rules are scattered across hundreds of confusing multi-page PDFs and outdated third-party portals.
- **Biased Marketing & Speculation:** Official brochures hide ground reality, while unverified forums and Reddit threads often provide contradictory, anecdotal advice.
- **Disregard for Student Experience:** Most search tools only evaluate rank numbers, ignoring qualitative factors like campus coding culture, faculty accessibility, student clubs, and placement opportunities.

### The Solution
CollegeConnect combines mathematical eligibility with deep qualitative evaluation:
- **Strict Mathematical Filter:** Evaluates your exact rank and exam pathway against historical closing cutoffs to prevent recommending out-of-reach institutions.
- **Smart Holistic College Matchmaker:** Ranks both public institutions and premier private universities based on coding culture, active clubs, faculty dynamics, and audited placement benchmarks.
- **Direct Peer Ground-Truth:** Lets applicants open anonymous inquiry tickets routed directly to verified campus seniors currently enrolled in those institutions.

---

## Core Features

- **Dual Branch Preferences:** Select primary and secondary engineering disciplines (CSE, IT, ECE, AI/ML, Data Science, Mechanical, and more) to find personalized branch-specific cohorts.
- **Public & Private Inclusion:** Seamlessly ranks both JoSAA institutions (IITs, NITs, IIITs) and top-tier private engineering universities (BITS Pilani, VIT Vellore, MIT Manipal, LNMIIT, Thapar, JIIT Noida, RVCE).
- **Holistic Match Scoring:** Every recommendation features an AI Match Score (out of 100), a feasibility tier (Safe, Competitive, or Borderline), and a concise 3-sentence review detailing student life, faculty behavior, and placement conversion.
- **Anonymous Peer Ticketing:** Integrated support ticket engine routing applicant questions directly to verified senior mentors with full anonymity.
- **One-Click Persona Switcher:** Instant role-switching between prospective applicants and verified campus seniors for smooth demonstration without credential roadblocks.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI Integration:** Google Generative AI (Gemini Flash)
- **Local Database:** SQLite via better-sqlite3 (Zero-cloud state persistence)
- **Validation:** Zod Schema Validation

---

## Quick Start & Local Setup

### Prerequisites
- Node.js 18.17 or later
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/arnav1308/CollegeConnect.git
cd CollegeConnect
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize SQLite Database
Seed the local database with institutions, programmes, and test demo personas:
```bash
npm run init-db
```

### 4. Configure Environment Variables
Create a `.env.local` file in the project root:
```env
# Google Gemini API Key
# Obtain your free API key from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to experience CollegeConnect.
