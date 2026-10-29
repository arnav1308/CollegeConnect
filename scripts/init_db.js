const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

console.log(`[Database Init] Connecting to SQLite at: ${dbPath}`);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('[Database Init] Dropping legacy tables if present...');
db.exec(`
  DROP TABLE IF EXISTS ratings;
  DROP TABLE IF EXISTS ticket_messages;
  DROP TABLE IF EXISTS ticket_assignments;
  DROP TABLE IF EXISTS tickets;
  DROP TABLE IF EXISTS cutoff_records;
  DROP TABLE IF EXISTS profiles;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS admission_routes;
  DROP TABLE IF EXISTS programmes;
  DROP TABLE IF EXISTS institutions;
`);

console.log('[Database Init] Creating relational tables...');
db.exec(`
  CREATE TABLE institutions (
    id TEXT PRIMARY KEY,
    canonical_name TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE programmes (
    id TEXT PRIMARY KEY,
    institution_id TEXT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    degree TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(institution_id, degree, branch_name)
  );

  CREATE TABLE admission_routes (
    id TEXT PRIMARY KEY,
    exam_name TEXT NOT NULL,
    authority TEXT NOT NULL,
    year INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(exam_name, authority, year)
  );

  CREATE TABLE cutoff_records (
    id TEXT PRIMARY KEY,
    route_id TEXT NOT NULL REFERENCES admission_routes(id) ON DELETE CASCADE,
    institution_id TEXT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    programme_id TEXT NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    seat_category TEXT NOT NULL,
    quota TEXT NOT NULL,
    rank_type TEXT NOT NULL,
    opening_rank INTEGER NOT NULL,
    closing_rank INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('applicant', 'student', 'moderator')),
    created_at TEXT NOT NULL
  );

  CREATE TABLE profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    password_hash TEXT,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('applicant', 'student', 'moderator')),
    verified_status INTEGER NOT NULL DEFAULT 0,
    is_verified INTEGER NOT NULL DEFAULT 0,
    availability INTEGER NOT NULL DEFAULT 1,
    college TEXT,
    branch TEXT,
    grad_year TEXT,
    institution_id TEXT REFERENCES institutions(id) ON DELETE SET NULL,
    programme_id TEXT REFERENCES programmes(id) ON DELETE SET NULL,
    admission_year INTEGER,
    created_at TEXT NOT NULL
  );

  CREATE TABLE tickets (
    id TEXT PRIMARY KEY,
    applicant_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    institution_id TEXT NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
    programme_id TEXT NOT NULL REFERENCES programmes(id) ON DELETE RESTRICT,
    requested_year INTEGER NOT NULL,
    topic TEXT NOT NULL,
    question TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('draft', 'submitted', 'matching', 'assigned', 'claimed', 'answered', 'resolved')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE ticket_assignments (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    respondent_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    assigned_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'claimed', 'declined', 'expired')),
    updated_at TEXT NOT NULL,
    UNIQUE(ticket_id, respondent_id)
  );

  CREATE TABLE ticket_messages (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_user_id TEXT NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    senior_id TEXT NOT NULL,
    college TEXT NOT NULL,
    academics INTEGER NOT NULL CHECK(academics BETWEEN 1 AND 5),
    faculty INTEGER NOT NULL CHECK(faculty BETWEEN 1 AND 5),
    placements INTEGER NOT NULL CHECK(placements BETWEEN 1 AND 5),
    internships INTEGER NOT NULL CHECK(internships BETWEEN 1 AND 5),
    hostel INTEGER NOT NULL CHECK(hostel BETWEEN 1 AND 5),
    mess INTEGER NOT NULL CHECK(mess BETWEEN 1 AND 5),
    campus_life INTEGER NOT NULL CHECK(campus_life BETWEEN 1 AND 5),
    peer_group INTEGER NOT NULL CHECK(peer_group BETWEEN 1 AND 5),
    infrastructure INTEGER NOT NULL CHECK(infrastructure BETWEEN 1 AND 5),
    clubs INTEGER NOT NULL CHECK(clubs BETWEEN 1 AND 5),
    fests INTEGER NOT NULL CHECK(fests BETWEEN 1 AND 5),
    coding_culture INTEGER NOT NULL CHECK(coding_culture BETWEEN 1 AND 5),
    sports INTEGER NOT NULL CHECK(sports BETWEEN 1 AND 5),
    administration INTEGER NOT NULL CHECK(administration BETWEEN 1 AND 5),
    fees INTEGER NOT NULL CHECK(fees BETWEEN 1 AND 5),
    location INTEGER NOT NULL CHECK(location BETWEEN 1 AND 5),
    safety INTEGER NOT NULL CHECK(safety BETWEEN 1 AND 5),
    overall INTEGER NOT NULL CHECK(overall BETWEEN 1 AND 5),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(senior_id)
  );

  CREATE INDEX idx_ratings_college ON ratings(college);

  CREATE INDEX idx_cutoffs_query ON cutoff_records(route_id, seat_category, quota, closing_rank);
  CREATE INDEX idx_tickets_applicant ON tickets(applicant_id, status);
  CREATE INDEX idx_assignments_respondent ON ticket_assignments(respondent_id, status);
  CREATE INDEX idx_users_email ON users(email);
  CREATE INDEX idx_profiles_email ON profiles(email);
`);

console.log('[Database Init] Seeding mock institutions, programs, and cutoffs...');
const now = new Date().toISOString();

const insertInstitution = db.prepare(`
  INSERT INTO institutions (id, canonical_name, city, state, created_at)
  VALUES (?, ?, ?, ?, ?)
`);
insertInstitution.run('inst-iitb', 'Indian Institute of Technology Bombay', 'Mumbai', 'Maharashtra', now);
insertInstitution.run('inst-nitt', 'National Institute of Technology Tiruchirappalli', 'Tiruchirappalli', 'Tamil Nadu', now);
insertInstitution.run('inst-iitd', 'Indian Institute of Technology Delhi', 'New Delhi', 'Delhi', now);

const insertProgramme = db.prepare(`
  INSERT INTO programmes (id, institution_id, degree, branch_name, created_at)
  VALUES (?, ?, ?, ?, ?)
`);
insertProgramme.run('prog-iitb-cse', 'inst-iitb', 'B.Tech', 'Computer Science and Engineering', now);
insertProgramme.run('prog-iitb-ee', 'inst-iitb', 'B.Tech', 'Electrical Engineering', now);
insertProgramme.run('prog-nitt-cse', 'inst-nitt', 'B.Tech', 'Computer Science and Engineering', now);
insertProgramme.run('prog-nitt-ece', 'inst-nitt', 'B.Tech', 'Electronics and Communication Engineering', now);
insertProgramme.run('prog-iitd-cse', 'inst-iitd', 'B.Tech', 'Computer Science and Engineering', now);

const insertRoute = db.prepare(`
  INSERT INTO admission_routes (id, exam_name, authority, year, created_at)
  VALUES (?, ?, ?, ?, ?)
`);
insertRoute.run('route-jeeadv-2024', 'JEE Advanced', 'JoSAA', 2024, now);
insertRoute.run('route-jeemain-2024', 'JEE Main', 'CSAB', 2024, now);

const insertCutoff = db.prepare(`
  INSERT INTO cutoff_records (id, route_id, institution_id, programme_id, round, seat_category, quota, rank_type, opening_rank, closing_rank, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
insertCutoff.run('cut-1', 'route-jeeadv-2024', 'inst-iitb', 'prog-iitb-cse', 6, 'OPEN', 'AI', 'All India Rank', 1, 68, now);
insertCutoff.run('cut-2', 'route-jeeadv-2024', 'inst-iitb', 'prog-iitb-ee', 6, 'OPEN', 'AI', 'All India Rank', 150, 480, now);
insertCutoff.run('cut-3', 'route-jeeadv-2024', 'inst-iitd', 'prog-iitd-cse', 6, 'OPEN', 'AI', 'All India Rank', 25, 116, now);
insertCutoff.run('cut-4', 'route-jeemain-2024', 'inst-nitt', 'prog-nitt-cse', 6, 'OPEN', 'OS', 'All India Rank', 750, 4850, now);
insertCutoff.run('cut-5', 'route-jeemain-2024', 'inst-nitt', 'prog-nitt-ece', 6, 'OPEN', 'OS', 'All India Rank', 1800, 8900, now);
insertCutoff.run('cut-6', 'route-jeeadv-2024', 'inst-iitb', 'prog-iitb-cse', 6, 'EWS', 'AI', 'Category Rank', 2, 18, now);
insertCutoff.run('cut-7', 'route-jeeadv-2024', 'inst-iitb', 'prog-iitb-cse', 6, 'OBC-NCL', 'AI', 'Category Rank', 10, 55, now);

console.log('[Database Init] Seeding mock demo profiles with bcrypt password hashes...');
const defaultPasswordHash = bcrypt.hashSync('password123', 10);

const insertUser = db.prepare(`
  INSERT INTO users (id, email, password_hash, role, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

const insertProfile = db.prepare(`
  INSERT INTO profiles (
    user_id, email, password_hash, display_name, role,
    verified_status, is_verified, availability, college, branch, grad_year,
    institution_id, programme_id, admission_year, created_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertUser.run('user-applicant-1', 'applicant@collegeconnect.com', defaultPasswordHash, 'applicant', now);
insertProfile.run(
  'user-applicant-1',
  'applicant@collegeconnect.com',
  defaultPasswordHash,
  'Rahul Sharma (Applicant)',
  'applicant',
  0,
  0,
  1,
  null,
  null,
  null,
  null,
  null,
  null,
  now
);

insertUser.run('user-student-senior-1', 'senior@iitb.ac.in', defaultPasswordHash, 'student', now);
insertProfile.run(
  'user-student-senior-1',
  'senior@iitb.ac.in',
  defaultPasswordHash,
  'Aman Verma (IIT Bombay CSE 3rd Year)',
  'student',
  1,
  1,
  1,
  'IIT Bombay',
  'Computer Science and Engineering',
  '2026',
  'inst-iitb',
  'prog-iitb-cse',
  2022,
  now
);

console.log('✅ [Database Init] database.sqlite created and seeded successfully!');
console.log('------------------------------------------------------------');
console.log('Demo Users Seeded (password: password123):');
console.log('1. Applicant:       applicant@collegeconnect.com / user-applicant-1');
console.log('2. Verified Senior: senior@iitb.ac.in            / user-student-senior-1');
console.log('------------------------------------------------------------');
