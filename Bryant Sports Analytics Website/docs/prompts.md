# Bryant Sports Analytics Hub — Full App Specification

## Prompt

Build a full-stack web application called **Bryant Sports Analytics Hub** — the central platform for Bryant University's sports analytics program. The app serves current students, faculty advisors, alumni working in professional sports, and industry recruiters. Its purpose is to give Bryant sports analytics students a dominant competitive advantage in getting hired by professional teams, leagues, agencies, and sports media companies.

The application must include the following features, organized into four pillars: **Showcase**, **Community**, **Career**, and **Growth**.

---

## 1. Showcase — Project Portfolio System

### Project Uploads
- Students create project pages with: title, sport(s), abstract, full write-up (rich text / markdown), methodology, tools and languages used, datasets (with sources cited), key findings, and embedded media
- Supported media: inline charts/images, Jupyter notebook renders, Tableau Public and Power BI embeds, video walkthroughs (uploaded or YouTube/Loom links), and GitHub repo links
- Each project has a visibility toggle: **Public** (anyone on the web), **Bryant-only** (authenticated users), or **Private** (only the author and invited collaborators)

### Tagging & Discovery
- Multi-dimensional tag system:
  - **Sport**: NFL, NBA, MLB, NHL, MLS, WNBA, college (with conference/school subtags), soccer, esports, motorsport, other
  - **Technique**: regression, classification, clustering, time series, NLP, computer vision, simulation/Monte Carlo, Bayesian inference, neural networks, web scraping, geospatial analysis
  - **Tool**: Python, R, SQL, Tableau, Power BI, Excel, Stata, MATLAB, dbt, Spark, AWS, GCP
  - **Domain**: player evaluation, draft modeling, in-game strategy, injury prediction, fan engagement, ticket pricing, salary cap / contract valuation, betting markets, broadcast analytics, recruiting
- Filterable and searchable project gallery with sort options (newest, most viewed, highest rated, most discussed)

### Portfolio Pages
- Each student gets a personal portfolio page at a clean URL (e.g., `/portfolio/bschubbe`)
- Displays bio, headshot, class year, concentration, project gallery, skills, certifications, and links (LinkedIn, GitHub, personal site)
- Shareable and embeddable — designed to be linked on resumes and LinkedIn profiles
- Version history on projects so students can demonstrate iterative improvement over time
- PDF export of the full portfolio for offline sharing

---

## 2. Community — Social Feed & Feedback

### Feed
- Real-time social feed where students post updates, questions, links to articles or datasets, hot takes, job leads, and event announcements
- Posts support rich text, images, code snippets (syntax highlighted), and link previews
- Reactions (upvote, insightful, fire, clap) and threaded comment replies on every post and project
- Channels organized by: sport, graduating class, course (e.g., ISA 340), club, and open topics
- Pinned posts per channel for important resources or announcements

### Peer Review System
- Authors can mark a project as "Open for Review" and select review criteria (methodology, visualization, writing clarity, code quality, statistical rigor)
- Reviewers receive a structured rubric and leave scored + written feedback
- Reviewers earn reputation points and a "Reviewer" badge on their profile
- Review history is visible on both the reviewer's and author's profiles

### Mentorship & Tagging
- Tag faculty advisors, alumni mentors, or industry contacts on any post or project to pull them into the conversation
- Faculty and alumni get a lightweight dashboard showing items they've been tagged in and pending review requests

### Messaging
- Direct messages (1:1) and group chats for private collaboration
- Message threads can reference specific projects or posts with inline previews

### Weekly Digest
- Every Sunday, the platform auto-generates a digest email summarizing the week's activity:
  - New projects published (with thumbnails and one-line summaries)
  - Most-discussed posts and trending topics
  - Upcoming events and deadlines
  - Active contributors and notable peer reviews
  - New job/internship postings
- AI-powered summarization condenses dozens of posts into a scannable newsletter
- Digest is sent to all students, faculty, and opted-in alumni
- Full digest archive accessible on the platform with search

---

## 3. Career — Launchpad for Getting Hired in Sports

### Job & Internship Board
- Aggregated listings from: NFL, NBA, MLB, NHL, MLS, WNBA, MiLB, USL, NWSL, college athletics departments, sports agencies (CAA, Wasserman, Octagon), sports media (ESPN, The Athletic, Sportradar), betting/DFS companies (DraftKings, FanDuel), and tech companies with sports divisions
- Filter by: role type (analyst, data engineer, data scientist, scout, researcher, strategist), sport, location, experience level (intern, entry-level, mid-level), and remote/on-site
- Students can save listings, set alerts for new postings matching their criteria, and track application status
- Alumni and industry partners can post roles directly to the board

### Application Tracker
- Kanban-style board: Interested → Applied → Phone Screen → Interview → Offer → Accepted/Rejected
- Attach notes, contact info, and follow-up reminders to each application
- Timeline view showing all activity across applications

### Resume & Cover Letter Builder
- Sports-analytics-specific templates that foreground: technical projects (auto-populated from portfolio), tools and languages, domain knowledge by sport, and relevant coursework
- AI-assisted suggestions: improve bullet points, tailor a cover letter to a specific job description, highlight the most relevant projects for a given role
- Export to PDF with clean, professional formatting

### Interview Prep
- Community-sourced question bank organized by category: SQL challenges, probability and statistics, case studies (e.g., "How would you build a pitch-framing model?"), programming (Python/R live coding), and behavioral
- Students can submit answers, and peers/mentors vote on quality
- Mock interview scheduling: pair with another student or an alumni mentor for a timed practice session with structured feedback forms
- Curated reading list: key papers, blog posts, and talks that sports analytics hiring managers expect candidates to know

### Portfolio Reviews
- Alumni and industry mentors can sign up for portfolio review slots
- Students book 20-minute sessions to walk through their portfolio and get targeted feedback
- Review notes are saved to the student's profile for reference

---

## 4. Growth — Skill Development & Recognition

### Learning Paths
- Curated, ordered roadmaps for specific career goals:
  - "Break into NFL Analytics" — nflFastR, EPA models, tracking data, combine analysis
  - "NBA Draft Modeling" — player projection, statistical similarity, clustering, visualization
  - "Sports Betting & Expected Value" — probability, line movement, bankroll management, market efficiency
  - "Broadcast & Media Analytics" — data storytelling, visualization best practices, audience engagement
  - "Baseball R&D" — Statcast, pitch modeling, batted ball analysis, TrackMan/Hawk-Eye data
  - "Sports Data Engineering" — SQL, ETL pipelines, cloud warehousing, API design, real-time data
- Each path links to specific platform tutorials, external courses, example projects, and challenge problems

### Challenge Board
- Weekly data challenge posted every Monday with a real dataset and a problem statement (e.g., "Predict March Madness upsets using regular season stats," "Build an NFL passer rating alternative")
- Students submit solutions as projects on the platform
- Community voting + judge panel selects winners each week
- Leaderboard tracks challenge participation and wins over time
- Challenge archive with past problems and winning solutions for self-study

### Tutorials & Guides
- Student-contributed tutorials on tools, techniques, and data sources: Python (pandas, scikit-learn, matplotlib, plotly), R (tidyverse, ggplot2), SQL, Statcast API, nflFastR, Sportradar, NBA API, web scraping (BeautifulSoup, Selenium), tracking data formats (Next Gen Stats, Second Spectrum, Hawk-Eye)
- Tutorials are reviewed and rated by peers
- "Staff Pick" badge for tutorials endorsed by faculty

### Certification & Course Tracker
- Students log completed external courses and certifications (Coursera, DataCamp, edX, AWS, Google Analytics, Tableau Desktop Specialist, etc.)
- Certifications display on the portfolio page
- Platform can suggest relevant certifications based on the student's learning path and skill gaps

---

## 5. Alumni & Industry Network

### Alumni Directory
- Searchable directory of Bryant sports analytics alumni filtered by: current employer (team, league, agency, media company), job title, sport, graduation year, and location
- Each alumni profile shows their career trajectory, projects they published as students, and availability for mentorship

### Mentor Matching
- Students fill out a short form: sport interests, career goals, and what they want help with (portfolio, interviews, networking, technical skills)
- Algorithm suggests 3-5 alumni mentors based on alignment
- Mentors set availability and preferred cadence (monthly check-in, ad hoc, async only)

### Alumni Spotlights & AMAs
- Monthly featured alumni profile with a written or video Q&A about their career path
- Live AMA sessions (text-based on the platform) where students can ask questions in real time
- Spotlight archive organized by employer and sport

### Events Calendar
- Centralized calendar for: guest speaker events, networking mixers, career fairs, conference watch parties (SSAC, Saberseminar, CMSAC), club meetings, and workshop dates
- RSVP tracking and calendar sync (Google Calendar, Outlook)

### Referral Pipeline
- Alumni can flag open roles at their organizations and indicate willingness to refer Bryant students
- Students see "Bryant connection" badges on job listings where an alum works
- Warm introduction requests flow through the platform so alumni control their inbox

---

## 6. Platform Intelligence & Metrics

### Personal Dashboard
- Profile views over time, project engagement (views, comments, ratings), peer review contributions, challenge participation, and skills growth radar chart
- "Career Readiness Score" — a composite metric based on portfolio completeness, skills demonstrated, peer feedback quality, and community participation
- Suggested next actions: "Your portfolio is missing an SQL project," "3 new NBA analyst roles match your profile," "You haven't posted in 2 weeks"

### Program-Level Analytics (Faculty/Admin View)
- Aggregate metrics: total projects published, active users per week, most popular sports/tools/techniques, job placement rates
- Semester reports exportable as PDF for program marketing, accreditation, and recruiting prospective students
- Comparison across cohorts to track program growth

### Leaderboard (Opt-In)
- Recognizes: most active contributors, top-rated projects, most helpful reviewers, challenge winners, and longest posting streaks
- Opt-in only — students choose whether to appear
- Seasonal resets to keep competition fresh

---

## 7. Team Collaboration Spaces

- Private workspaces for group projects, class assignments, and club initiatives
- Shared file storage with version tracking
- Task board (to-do, in progress, done) for managing group work
- Meeting notes with action items
- GitHub integration: link a repo, display commit activity, and sync README to the workspace
- Presentation mode: full-screen view of a project for rehearsing final deliverables and class presentations

---

## Technical Requirements

### Stack
- **Frontend**: Next.js (React) with TypeScript, Tailwind CSS for styling, responsive mobile-first design
- **Backend**: Node.js (Express or Fastify) REST API + WebSocket server for real-time features
- **Database**: PostgreSQL (relational data) + Redis (caching, session management, real-time pub/sub)
- **Auth**: Bryant University SSO (SAML/OAuth) as primary, with Google and GitHub OAuth as fallbacks; role-based access (student, faculty, alumni, recruiter, admin)
- **Storage**: S3-compatible object storage for file uploads (datasets, images, notebooks, videos)
- **AI Services**: LLM integration (Claude API) for weekly digest summarization, resume/cover letter suggestions, project tag recommendations, and career readiness nudges
- **Search**: Full-text search (PostgreSQL tsvector or Elasticsearch) across projects, posts, profiles, jobs, and tutorials
- **Email**: Transactional email service (SendGrid or Resend) for digests, notifications, and verification
- **Deployment**: Containerized (Docker), deployed on Vercel (frontend) + Railway or AWS (backend), CI/CD via GitHub Actions

### Key Integrations
- **GitHub**: OAuth login, repo linking on projects, commit activity in collaboration spaces
- **LinkedIn**: Profile import, "Share to LinkedIn" on projects, job listing cross-posting
- **Tableau Public / Power BI**: iframe embedding of published dashboards within project pages
- **Google Calendar / Outlook**: Event sync for the events calendar
- **Slack / Discord**: Optional webhook bridge for feed notifications
- **Sports Data APIs**: Direct links and documentation for Sportradar, Statcast (Baseball Savant), nflFastR, NBA API, FBref, and Transfermarkt

### Non-Functional Requirements
- **Performance**: Pages load in under 2 seconds; feed updates appear in real time with no manual refresh
- **Accessibility**: WCAG 2.1 AA compliant — keyboard navigation, screen reader support, sufficient contrast ratios
- **Privacy**: Students control visibility of every project and post (public, Bryant-only, private); FERPA-aware data handling
- **Security**: HTTPS everywhere, input sanitization, rate limiting, CSRF protection, secure file upload validation
- **Moderation**: Automated spam detection on feed posts; faculty/admin moderation tools for flagging and removing content
- **Scalability**: Architecture supports the full Bryant analytics community (hundreds of students, faculty, alumni, and recruiters) with room to grow

---

## What Makes This a Dominant Hiring Advantage

1. **Proof of Work** — Every student graduates with a polished, public portfolio of real analytics projects, not just a transcript. Hiring managers see what you can do, not just what courses you took.
2. **Network Density** — Structured alumni mentorship, warm referrals, and direct recruiter access create pathways into organizations that cold applications never open.
3. **Volume of Reps** — Weekly challenges, peer reviews, and a constant feedback loop produce more analytical reps in one semester than most programs deliver in four years.
4. **Visibility to Employers** — Recruiters can browse Bryant student work directly on the platform. The app becomes a recruiting pipeline, not just a student tool.
5. **Community Sharpening** — Students push each other through public work, honest feedback, and friendly competition. The cohort effect compounds individual talent.
6. **Richer Signal** — Activity metrics, peer endorsements, review contributions, and challenge results give employers a multidimensional view of a candidate that GPA and a one-page resume cannot.
7. **Career Infrastructure** — Job tracking, interview prep, resume tools, and portfolio reviews eliminate the friction between "I have skills" and "I have an offer."

---

## Phased Rollout

| Phase | Scope | Key Deliverables |
|-------|-------|------------------|
| **1 — Foundation** | Auth, profiles, project uploads, portfolio pages, basic feed | User registration with Bryant SSO, project CRUD, tagging system, portfolio URL, feed with posts and reactions |
| **2 — Community** | Peer review, threaded comments, messaging, channels | Structured review rubrics, channel creation, DMs, mention/tag system, notification preferences |
| **3 — Career** | Job board, application tracker, resume builder, interview prep | Job aggregation + posting, Kanban tracker, PDF resume export, question bank with voting |
| **4 — Intelligence** | AI weekly digest, challenge board, learning paths, tutorials | Automated Sunday digest, challenge submission and voting, curated roadmaps, tutorial publishing |
| **5 — Network** | Alumni directory, mentor matching, spotlights, events calendar, referral pipeline | Alumni profiles, matching algorithm, AMA infrastructure, calendar sync, referral flagging |
| **6 — Polish** | Platform metrics, leaderboard, recruiter access, PDF portfolio export, mobile optimization | Personal dashboards, career readiness score, recruiter browse mode, responsive audit, performance tuning |

---

## Design Principles

- **Student-first**: Every feature should reduce friction between doing good work and getting recognized for it
- **Show, don't tell**: The platform proves competence through artifacts, not claims
- **Low floor, high ceiling**: A first-year student posting their first scatter plot and a senior publishing a neural network model should both feel at home
- **Bryant identity**: The design should feel unmistakably Bryant — use university brand colors, typography, and tone while keeping the UI modern and professional
- **Open by default**: Encourage public sharing; make privacy easy but not the default, because visibility is the whole point
