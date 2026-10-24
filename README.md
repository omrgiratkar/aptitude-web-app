# Aptitude Test Web App

Full-stack starter implementation using React + Tailwind CSS (Vite), Node.js + Express, and MongoDB/Mongoose.

## Features included
- Student registration with name, email, gender, department, password.
- Restricted Admin registration using `ADMIN_INVITE_CODE` (Admin role is never accepted from public student signup).
- Login with bcrypt password hashing and JWT authentication.
- Practice quiz by category and difficulty; server evaluates and returns answer explanations after submission.
- Separate mixed-category timed test with server-side deadline enforcement, saved answers, and private real-test score.
- Admin dashboard with student directory, question CRUD, real-test attempts, PDF scorecard download, and email scorecard action.
- Responsive React UI styled with Tailwind CSS.
- Seed script creates an initial Admin and sample questions.

## Requirements
- Node.js 20+ recommended
- MongoDB local or MongoDB Atlas connection string

## Setup

### 1. Configure backend
```bash
cd server
cp .env.example .env
```
Edit `server/.env`:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: long random secret
- `ADMIN_INVITE_CODE`: secret used for Admin registration
- `CLIENT_ORIGIN`: normally `http://localhost:5173`
- Optional email configuration: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`

### 2. Install dependencies and seed data
```bash
npm install
npm run seed
npm run dev
```
The default local test uses 9 questions (3 per category) so it works with the included sample seed data. Increase `TEST_QUESTION_COUNT` only after adding enough active questions in each category. The seed script creates the initial Admin using `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD` from `.env.example` / `.env`. Change these credentials before running seed. It also creates sample questions across all categories and difficulty levels.

### 3. Start frontend (new terminal)
```bash
cd client
npm install
cp .env.example .env
npm run dev
```
Open `http://localhost:5173`.

## Default seeded Admin
The values below are examples from `.env.example`; change them before seeding:
- Email: `admin@example.com`
- Password: `ChangeMe_Admin_123!`

Do not deploy these defaults. After changing `.env`, run `npm run seed` again if you need to recreate the initial Admin.

## How to use
1. Sign in as Admin and use Question Bank to add/edit/delete questions.
2. Register a Student from the signup page.
3. Student selects Practice, chooses a category and difficulty, answers questions, and submits to see explanations.
4. Student opens Take a Test to begin a mixed-category timed test.
5. After submission, the student sees only confirmation. Admin opens Results, downloads a PDF, or emails the scorecard.
6. Real-test marks are hidden from student-facing APIs until the Admin releases the scorecard through a successful configured email send.

## Email configuration
Email sending is optional during local development. If SMTP variables are missing, the API returns a clear configuration error and does not release the result. Configure a valid SMTP account to use the send-scorecard action. An email provider accepting a message does not guarantee inbox delivery.

## Important notes
- This is a runnable project foundation, not a guarantee of production security or uptime. Run tests and review before deploying for real exams.
- JWT is stored in localStorage for simplicity in this starter. For production, prefer secure HttpOnly cookies plus appropriate CSRF protections, or carefully review your token-storage threat model.
- The browser timer is only a display. The backend checks the deadline on answer-save and submission.
- Correct answers are not sent to the browser during active tests.
- Student score endpoints do not expose unreleased real-test marks.
- Use HTTPS, a strong JWT secret, rate limiting, backups, SMTP secrets, and restricted CORS in production.
