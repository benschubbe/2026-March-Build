# Bryant Sports Analytics Hub — Software Engineering Specification

**Version:** 1.0
**Last Updated:** 2026-03-30
**Project Lead:** Ben Schubbe
**Repository:** Bryant Sports Analytics Website

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Data Models](#3-data-models)
4. [Epics & User Stories](#4-epics--user-stories)
5. [Sprint Backlog](#5-sprint-backlog)
6. [Issue Tracker](#6-issue-tracker)
7. [User Testing Plan](#7-user-testing-plan)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [Risk Register](#9-risk-register)
10. [Definition of Done](#10-definition-of-done)

---

## 1. Product Overview

### 1.1 Vision

The Bryant Sports Analytics Hub is a full-stack web platform built for Bryant University's sports analytics program. It serves four user roles — students, faculty, alumni, and recruiters — with the goal of giving Bryant students a dominant competitive advantage in landing jobs in professional sports organizations, leagues, agencies, and media companies.

### 1.2 Problem Statement

Sports analytics students lack a centralized platform to showcase their work, receive structured feedback, connect with alumni in the industry, and prepare for the hiring process. Portfolios are scattered across Google Drive, GitHub repos, and class submissions. Alumni connections are informal. Interview prep is ad hoc. The result: talented students are invisible to hiring managers.

### 1.3 Success Metrics

| Metric | Target (Year 1) |
|--------|-----------------|
| Registered students | 80% of sports analytics majors |
| Projects published | 150+ |
| Peer reviews completed | 300+ |
| Alumni mentors registered | 30+ |
| Job applications tracked | 200+ |
| Weekly active users | 60% of registered base |
| Job placement rate improvement | +15% vs. prior cohort |

### 1.4 User Roles & Permissions

| Role | Can Publish Projects | Can Review | Can Post Jobs | Can View All Portfolios | Admin Panel |
|------|---------------------|-----------|--------------|------------------------|-------------|
| **Student** | Yes | Yes | No | Bryant-only + Public | No |
| **Faculty** | Yes | Yes | No | All | Yes |
| **Alumni** | No | Yes | Yes | All | No |
| **Recruiter** | No | No | Yes | Public only | No |
| **Admin** | Yes | Yes | Yes | All | Yes |

---

## 2. Technical Architecture

### 2.1 Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16, React 19, TypeScript 6 | Server & client rendering, routing |
| Styling | Tailwind CSS 4.2 | Utility-first CSS with Bryant brand tokens |
| Icons | Lucide React | Consistent icon library |
| Auth | NextAuth 5 (beta) | Credentials, GitHub, Google OAuth |
| ORM | Prisma 6 | Type-safe database queries |
| Database | PostgreSQL | Primary relational store |
| Real-time | WebSockets (planned) | Feed updates, messaging, notifications |
| AI | Claude API (planned) | Digest summarization, resume suggestions |
| Storage | S3-compatible (planned) | File uploads, datasets, media |
| Email | SendGrid/Resend (planned) | Weekly digest, notifications |

### 2.2 Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page (public)
│   ├── login/page.tsx              # Authentication
│   ├── register/page.tsx           # Registration
│   ├── api/auth/[...nextauth]/     # NextAuth API routes
│   └── (dashboard)/                # Authenticated layout group
│       ├── layout.tsx              # AppShell wrapper
│       ├── dashboard/page.tsx      # Personal dashboard
│       ├── projects/               # Project CRUD + gallery
│       ├── portfolio/              # Portfolio edit + public view
│       ├── feed/page.tsx           # Social feed
│       ├── channels/page.tsx       # Channel browser
│       ├── messages/page.tsx       # Direct messaging
│       ├── reviews/page.tsx        # Peer review hub
│       ├── jobs/page.tsx           # Job board
│       ├── applications/page.tsx   # Application tracker
│       ├── resume/page.tsx         # Resume builder
│       ├── interview-prep/page.tsx # Interview preparation
│       ├── learning/page.tsx       # Learning paths
│       ├── challenges/page.tsx     # Weekly challenges
│       ├── tutorials/page.tsx      # Tutorial library
│       ├── certifications/page.tsx # Certification tracker
│       ├── alumni/page.tsx         # Alumni directory
│       ├── mentorship/page.tsx     # Mentor matching
│       └── events/page.tsx         # Events calendar
├── components/
│   ├── ui/                         # Reusable UI primitives
│   │   ├── button.tsx, card.tsx, badge.tsx, avatar.tsx
│   │   ├── input.tsx, textarea.tsx, select.tsx
│   │   ├── modal.tsx, tabs.tsx, empty-state.tsx
│   └── layout/
│       ├── app-shell.tsx, sidebar.tsx, topbar.tsx
│   └── providers.tsx               # SessionProvider wrapper
├── lib/
│   ├── auth.ts                     # NextAuth config
│   ├── prisma.ts                   # Prisma singleton
│   └── utils.ts                    # cn, formatDate, slugify, timeAgo, etc.
prisma/
└── schema.prisma                   # 19 models, 11 enums
```

### 2.3 UI Component Library

| Component | Variants | Notes |
|-----------|----------|-------|
| Button | primary, secondary, outline, ghost, danger / sm, md, lg | Loading spinner state |
| Card | Card, CardHeader, CardContent, CardFooter | Composable sections |
| Badge | default, sport, technique, tool, domain, success, warning, error | Color-coded by type |
| Avatar | sm (32px), md (40px), lg (48px), xl (64px) | Image or initials fallback |
| Input | Standard with label + error | forwardRef, gold focus ring |
| Textarea | Standard with label + error | Configurable rows |
| Select | Standard with label + options array | Custom chevron |
| Modal | Overlay + centered panel | Escape key, body scroll lock |
| Tabs | Tabs, TabList, Tab, TabPanel | Context-based controlled state |
| EmptyState | icon, title, description, action | Centered layout |

---

## 3. Data Models

### 3.1 Entity Relationship Summary

The database contains **19 models** and **11 enums** organized around the platform's four pillars.

**Core Entities:**
- `User` — Central hub; relates to all content and social models
- `Project` — Student work with multi-dimensional tags (sport[], technique[], tools[], domain[])
- `Post` — Social feed content tied to optional channels
- `Comment` — Self-referential threading on projects and posts
- `Review` — 5-dimension scoring rubric for peer review

**Career Entities:**
- `Job` — Listings with role type, experience level, sport, and Bryant connection flag
- `Application` — Status pipeline (Interested → Accepted/Rejected)

**Community Entities:**
- `Channel` — Typed groups (Sport, Class, Club, General)
- `Reaction` — 4 types (Upvote, Insightful, Fire, Clap) with unique constraints
- `Message` — Sender/receiver DMs with read tracking

**Growth Entities:**
- `Challenge` / `ChallengeSubmission` — Weekly contests with voting and winners
- `LearningPath` — Curated roadmaps with JSON step arrays
- `Tutorial` — Student-authored guides with staff pick flag
- `Certification` — External credential tracking

**Network Entities:**
- `MentorMatch` — Mentor/mentee pairing with status and cadence
- `Event` / `EventRsvp` — Calendar events with RSVP tracking
- `WeeklyDigest` — AI-generated summary archive
- `Tag` — Many-to-many with projects

### 3.2 Enums

| Enum | Values |
|------|--------|
| Role | STUDENT, FACULTY, ALUMNI, RECRUITER, ADMIN |
| Visibility | PUBLIC, BRYANT_ONLY, PRIVATE |
| ReactionType | UPVOTE, INSIGHTFUL, FIRE, CLAP |
| ChannelType | SPORT, CLASS, CLUB, GENERAL |
| RoleType | ANALYST, DATA_ENGINEER, DATA_SCIENTIST, SCOUT, RESEARCHER, STRATEGIST, OTHER |
| ExperienceLevel | INTERN, ENTRY, MID |
| ApplicationStatus | INTERESTED, APPLIED, PHONE_SCREEN, INTERVIEW, OFFER, ACCEPTED, REJECTED |
| EventType | SPEAKER, MIXER, CAREER_FAIR, WORKSHOP, WATCH_PARTY, MEETING |
| MentorMatchStatus | PENDING, ACTIVE, COMPLETED |
| MentorCadence | MONTHLY, AD_HOC, ASYNC |

---

## 4. Epics & User Stories

### Epic 1: Authentication & User Profiles

> *As a Bryant student, I can create an account and manage my profile so that I have an identity on the platform.*

| ID | User Story | Acceptance Criteria | Priority | Points |
|----|-----------|---------------------|----------|--------|
| US-1.1 | As a student, I can register with my email, name, class year, and concentration | Form validates all fields; account created with STUDENT role; redirected to dashboard | P0 | 3 |
| US-1.2 | As a user, I can log in with email/password | Credentials validated against DB; JWT session created; error shown for bad creds | P0 | 2 |
| US-1.3 | As a user, I can log in with GitHub or Google OAuth | OAuth flow completes; user created if new; session established | P1 | 3 |
| US-1.4 | As a student, I can edit my profile (bio, headline, links, skills) | Changes persist to DB; updated profile visible on portfolio page | P0 | 3 |
| US-1.5 | As an admin, I can assign roles (Faculty, Alumni, Recruiter) to users | Role dropdown in admin panel; role change reflected across platform | P1 | 2 |
| US-1.6 | As a user, I can upload a profile photo | Image stored in S3; displayed on avatar across platform | P2 | 2 |
| US-1.7 | As a user, I see a personalized dashboard after login | Dashboard shows my stats, activity, suggestions, and upcoming events | P0 | 5 |

### Epic 2: Project Portfolio

> *As a student, I can publish analytics projects so that I build a portfolio that hiring managers can see.*

| ID | User Story | Acceptance Criteria | Priority | Points |
|----|-----------|---------------------|----------|--------|
| US-2.1 | As a student, I can create a new project with title, abstract, content, and methodology | Project saved to DB with auto-generated slug; visible in gallery | P0 | 5 |
| US-2.2 | As a student, I can tag my project with sports, techniques, tools, and domains | Multi-select checkboxes persist to string arrays; tags render as badges | P0 | 3 |
| US-2.3 | As a student, I can set project visibility (Public, Bryant-only, Private) | Visibility enforced on gallery queries and direct URL access | P0 | 3 |
| US-2.4 | As a student, I can attach GitHub, Tableau, and video links to my project | Links render as clickable buttons in sidebar; Tableau embeds in iframe | P1 | 2 |
| US-2.5 | As a visitor, I can browse the project gallery with filters for sport, technique, tool, and sort | Filters apply in real-time; results update without page reload | P0 | 5 |
| US-2.6 | As a visitor, I can view a project detail page with content, comments, and author info | Full content rendered; author card in sidebar; related projects shown | P0 | 5 |
| US-2.7 | As a user, I can comment on a project | Comment persists with author, timestamp; appears in thread; supports replies | P0 | 3 |
| US-2.8 | As a student, I can save a project as draft before publishing | Draft state (no publishedAt); not shown in gallery; editable from "My Projects" | P1 | 2 |
| US-2.9 | As a student, I can edit or delete my published projects | Edit form pre-fills current data; delete requires confirmation | P1 | 3 |
| US-2.10 | As a student, I can upload datasets and notebooks to my project | Files stored in S3; download links rendered on project page | P2 | 5 |
| US-2.11 | As a student, I can view a version history of my project edits | Snapshot of previous content stored; diff view available | P3 | 5 |

### Epic 3: Public Portfolio Pages

> *As a student, I can share a polished portfolio page on my resume and LinkedIn.*

| ID | User Story | Acceptance Criteria | Priority | Points |
|----|-----------|---------------------|----------|--------|
| US-3.1 | As a student, I have a portfolio page at /portfolio/[username] | Page renders with my bio, skills, links, and project gallery | P0 | 5 |
| US-3.2 | As a visitor, I can browse a student's projects, reviews, certifications, and activity on their portfolio | Tabbed interface; each tab loads relevant data | P0 | 5 |
| US-3.3 | As a student, I can customize which projects appear on my portfolio | Include/exclude toggles on portfolio edit page | P1 | 2 |
| US-3.4 | As a student, I can export my portfolio as a PDF | PDF generates with profile info, project summaries, skills | P2 | 5 |
| US-3.5 | As a student, I can see stats on my portfolio (views, project engagement) | View counter increments; engagement metrics shown on dashboard | P1 | 3 |

### Epic 4: Social Feed & Community

> *As a student, I can participate in a social feed to share ideas, ask questions, and stay connected.*

| ID | User Story | Acceptance Criteria | Priority | Points |
|----|-----------|---------------------|----------|--------|
| US-4.1 | As a user, I can create a post with text, images, code snippets, and links | Post persists; appears at top of feed; supports rich content | P0 | 5 |
| US-4.2 | As a user, I can react to posts (Upvote, Insightful, Fire, Clap) | Reaction toggles on/off; count updates; unique per user per post | P0 | 3 |
| US-4.3 | As a user, I can comment on posts with threaded replies | Comments nest under posts; replies nest under comments | P0 | 3 |
| US-4.4 | As a user, I can filter the feed by category (Questions, Job Leads, Articles, Datasets, Hot Takes) | Category filter applies; feed updates without reload | P1 | 2 |
| US-4.5 | As a user, I can browse and join channels organized by sport, class, or club | Channel list shows name, type, member count; join/leave toggles | P1 | 3 |
| US-4.6 | As a user, I can tag faculty or alumni in posts to pull them into a conversation | @mention autocomplete; tagged user receives notification | P2 | 5 |
| US-4.7 | As a faculty member, I can pin posts in a channel | Pin button visible to faculty/admin; pinned posts appear at top | P2 | 2 |

### Epic 5: Peer Review System

> *As a student, I can get structured feedback on my projects to improve my work.*

| ID | User Story | Acceptance Criteria | Priority | Points |
|----|-----------|---------------------|----------|--------|
| US-5.1 | As a student, I can mark my project as "Open for Review" | Toggle on project; project appears in Open Requests queue | P0 | 2 |
| US-5.2 | As a reviewer, I can submit a structured review with 5 scores and written feedback | Scores (1-5) for methodology, visualization, writing, code quality, rigor; feedback text required | P0 | 5 |
| US-5.3 | As a student, I can view all reviews received on my projects | Reviews listed with reviewer name, scores, feedback, date | P0 | 3 |
| US-5.4 | As a reviewer, I earn reputation points and badges for reviewing | Review count tracked; "Reviewer" badge on profile; level shown (Bronze/Silver/Gold) | P1 | 3 |
| US-5.5 | As a user, I can view review history on portfolio pages | Given and received reviews listed on profile tabs | P1 | 2 |

### Epic 6: Direct Messaging

> *As a user, I can privately message other users to collaborate.*

| ID | User Story | Acceptance Criteria | Priority | Points |
|----|-----------|---------------------|----------|--------|
| US-6.1 | As a user, I can send a direct message to another user | Message persists; appears in recipient's conversation list | P1 | 5 |
| US-6.2 | As a user, I can view my conversations with unread indicators | Conversation list sorts by most recent; unread dot shown | P1 | 3 |
| US-6.3 | As a user, I can reference a project or post in a message | Inline preview card renders in the message thread | P2 | 3 |
| US-6.4 | As a user, I receive real-time message notifications | WebSocket push; notification dot in topbar; sound optional | P2 | 5 |

### Epic 7: Job Board & Application Tracker

> *As a student, I can discover job opportunities and track my applications in one place.*

| ID | User Story | Acceptance Criteria | Priority | Points |
|----|-----------|---------------------|----------|--------|
| US-7.1 | As a student, I can browse job listings filtered by role type, sport, experience level, and remote | Filters apply; results update; cards show key details | P0 | 5 |
| US-7.2 | As a student, I can see "Bryant Connection" badges on jobs where alumni work | Gold badge on listings where bryantConnection=true | P0 | 2 |
| US-7.3 | As a student, I can save jobs and add them to my application tracker | "Save" and "Track" buttons on each listing; appear in applications page | P0 | 3 |
| US-7.4 | As a student, I can manage applications in a Kanban board (Interested → Accepted/Rejected) | Drag-and-drop between columns; status persists | P0 | 5 |
| US-7.5 | As a student, I can add notes, contacts, and follow-up dates to each application | Fields editable in detail modal; follow-up reminders display | P1 | 3 |
| US-7.6 | As an alumni, I can post job listings from my organization | Job creation form; posted by alumni user; appears in board | P1 | 3 |
| US-7.7 | As a student, I can set alerts for new jobs matching my criteria | Alert preferences saved; email or in-app notification on match | P2 | 5 |

### Epic 8: Resume Builder

> *As a student, I can build a sports-analytics-specific resume that highlights my projects and technical skills.*

| ID | User Story | Acceptance Criteria | Priority | Points |
|----|-----------|---------------------|----------|--------|
| US-8.1 | As a student, I can build a resume with contact info, summary, education, projects, skills, experience, and certifications | All sections editable; data persists between sessions | P0 | 8 |
| US-8.2 | As a student, I can include/exclude specific portfolio projects on my resume | Checkboxes next to each project; preview updates in real time | P0 | 3 |
| US-8.3 | As a student, I can preview my resume in a formatted document view | Right panel shows styled resume; updates live as I edit | P0 | 5 |
| US-8.4 | As a student, I can export my resume as a PDF | PDF matches preview layout; downloads to browser | P1 | 5 |
| US-8.5 | As a student, I can choose from resume templates (Classic, Modern, Technical) | Template selector changes layout/styling of preview and PDF | P2 | 5 |
| US-8.6 | As a student, I can get AI suggestions for improving bullet points | Claude API generates improved phrasing; user can accept/reject | P3 | 8 |

### Epic 9: Interview Prep

> *As a student, I can prepare for sports analytics interviews with a question bank and mock sessions.*

| ID | User Story | Acceptance Criteria | Priority | Points |
|----|-----------|---------------------|----------|--------|
| US-9.1 | As a student, I can browse interview questions by category (SQL, Stats, Case Study, Programming, Behavioral) and difficulty | Filter tabs and difficulty badges; questions sorted by votes | P0 | 5 |
| US-9.2 | As a student, I can view community-submitted answers and vote on quality | Expandable answer section; upvote/downvote persists | P0 | 3 |
| US-9.3 | As a student, I can submit my own answer to a question | Text area with submit; answer appears in list | P1 | 3 |
| US-9.4 | As a student, I can schedule a mock interview with a peer or alumni mentor | Session creation form; both parties see on upcoming list | P2 | 5 |
| US-9.5 | As a student, I can browse a curated reading list of essential resources | Resources listed with category, author, description, external link | P1 | 2 |

### Epic 10: Learning Paths & Challenges

> *As a student, I can follow structured learning paths and compete in weekly challenges to build skills.*

| ID | User Story | Acceptance Criteria | Priority | Points |
|----|-----------|---------------------|----------|--------|
| US-10.1 | As a student, I can browse 6 learning paths with descriptions and step counts | Cards display title, sport, description, steps, estimated time | P0 | 3 |
| US-10.2 | As a student, I can expand a learning path to see individual steps and track progress | Checklist renders; completed steps checked; progress bar updates | P1 | 5 |
| US-10.3 | As a student, I can view the current weekly challenge with dataset and deadline | Active challenge card with countdown, description, submit button | P0 | 3 |
| US-10.4 | As a student, I can submit a challenge solution linked to a project | Submission creates ChallengeSubmission; links to Project if provided | P1 | 3 |
| US-10.5 | As a student, I can vote on challenge submissions | Vote count increments; one vote per user per submission | P1 | 3 |
| US-10.6 | As a user, I can view the challenge leaderboard | Top 10 by points; medals for top 3; current user highlighted | P1 | 2 |
| US-10.7 | As a student, I can browse past challenges with winning solutions | Archive list with title, winner, submission count | P1 | 2 |

### Epic 11: Tutorials & Certifications

> *As a student, I can learn from peer tutorials and track my professional certifications.*

| ID | User Story | Acceptance Criteria | Priority | Points |
|----|-----------|---------------------|----------|--------|
| US-11.1 | As a student, I can browse tutorials filtered by category and staff pick status | Grid of cards with filters; staff pick badge on endorsed tutorials | P0 | 3 |
| US-11.2 | As a student, I can write and publish a tutorial | Tutorial creation form with markdown editor; appears in library after publish | P1 | 5 |
| US-11.3 | As a faculty member, I can mark a tutorial as "Staff Pick" | Toggle button on tutorial; gold badge renders | P2 | 2 |
| US-11.4 | As a student, I can add certifications to my profile | Modal form for name, provider, date, verification URL | P0 | 3 |
| US-11.5 | As a student, I can see recommended certifications based on my skill gaps | Recommendations render based on profile analysis | P2 | 5 |

### Epic 12: Alumni Network & Mentorship

> *As a student, I can connect with alumni working in pro sports for mentorship and referrals.*

| ID | User Story | Acceptance Criteria | Priority | Points |
|----|-----------|---------------------|----------|--------|
| US-12.1 | As a student, I can browse the alumni directory filtered by employer, sport, and graduation year | Search + filters apply; alumni cards show current role and company | P0 | 5 |
| US-12.2 | As a student, I can view featured alumni spotlights with quotes | Spotlight card at top of directory; quote displayed | P0 | 2 |
| US-12.3 | As a student, I can fill out a mentor matching form (sport, career goals, help needed) | Form submits; suggested mentors displayed with match scores | P1 | 5 |
| US-12.4 | As a student, I can request mentorship from a suggested match | Request sent; mentor sees pending request; can accept/decline | P1 | 3 |
| US-12.5 | As a mentor, I can set my availability and preferred cadence | Settings persist; reflected on mentor card | P2 | 2 |
| US-12.6 | As a student, I can manage active mentorships with check-in scheduling | Active mentorship list; schedule button; message button | P1 | 3 |
| US-12.7 | As an alumni, I can flag open roles at my organization for referrals | Referral form; "Bryant Connection" badge appears on job listing | P2 | 3 |

### Epic 13: Events Calendar

> *As a user, I can discover and RSVP to sports analytics events.*

| ID | User Story | Acceptance Criteria | Priority | Points |
|----|-----------|---------------------|----------|--------|
| US-13.1 | As a user, I can view upcoming events in calendar and list format | Month grid with event dots; list below sorted by date | P0 | 5 |
| US-13.2 | As a user, I can RSVP to an event | RSVP toggles; attendee count updates; avatar stack shows attendees | P0 | 2 |
| US-13.3 | As a user, I can filter events by type (Speaker, Workshop, Career Fair, etc.) | Type filter; color-coded badges per type | P1 | 2 |
| US-13.4 | As a user, I can add an event to my Google Calendar or Outlook | Calendar sync link generates .ics or Google Calendar URL | P2 | 3 |
| US-13.5 | As a faculty/admin, I can create and manage events | Event creation form; edit/delete options | P1 | 3 |

### Epic 14: Weekly Digest & AI Features

> *As a user, I receive a weekly summary of platform activity powered by AI.*

| ID | User Story | Acceptance Criteria | Priority | Points |
|----|-----------|---------------------|----------|--------|
| US-14.1 | As a user, I receive a weekly digest email every Sunday | Email sent via SendGrid; digest contains new projects, trending posts, upcoming events | P1 | 8 |
| US-14.2 | As a user, I can view past digests in an archive on the platform | Digest list with date and content preview; full view on click | P2 | 3 |
| US-14.3 | As a user, the digest is AI-summarized from the week's activity | Claude API generates concise summaries from post/project data | P2 | 8 |
| US-14.4 | As a student, I get AI-powered suggestions on my resume bullet points | Claude API rewrites; user can accept/reject suggestions | P3 | 5 |
| US-14.5 | As a student, I get AI-suggested tags when publishing a project | Claude API analyzes content; suggests sport/technique/tool/domain tags | P3 | 5 |

### Epic 15: Platform Metrics & Leaderboard

> *As a user, I can track my growth and see how I compare to peers.*

| ID | User Story | Acceptance Criteria | Priority | Points |
|----|-----------|---------------------|----------|--------|
| US-15.1 | As a student, I see my Career Readiness Score on the dashboard | Composite score (0-100) based on portfolio, skills, network, interview prep | P1 | 5 |
| US-15.2 | As a student, I see suggested next actions to improve my score | Actionable items based on gaps (e.g., "Add a SQL project") | P1 | 3 |
| US-15.3 | As a student, I can opt into the leaderboard | Opt-in toggle in settings; leaderboard shows top contributors | P2 | 3 |
| US-15.4 | As a faculty member, I can view program-level analytics | Aggregate metrics: total projects, active users, job placement | P2 | 8 |
| US-15.5 | As a faculty member, I can export semester reports as PDF | PDF with charts, stats, and cohort comparison | P3 | 8 |

---

## 5. Sprint Backlog

### Sprint 1 (Weeks 1-2): Foundation & Auth

**Goal:** Users can register, log in, and see their dashboard.

| Ticket | Story | Points | Status |
|--------|-------|--------|--------|
| BSAH-001 | Set up Next.js project, Tailwind, Prisma, NextAuth | 3 | Done |
| BSAH-002 | Create Prisma schema with all 19 models | 5 | Done |
| BSAH-003 | Build registration page (US-1.1) | 3 | Done |
| BSAH-004 | Build login page with credentials (US-1.2) | 2 | Done |
| BSAH-005 | Add GitHub + Google OAuth (US-1.3) | 3 | Done |
| BSAH-006 | Build UI component library (Button, Card, Badge, Avatar, Input, etc.) | 5 | Done |
| BSAH-007 | Build AppShell layout (sidebar, topbar, navigation) | 5 | Done |
| BSAH-008 | Build landing page with hero, stats, featured projects | 5 | Done |
| BSAH-009 | Build personal dashboard (US-1.7) | 5 | Done |
| **Total** | | **36** | |

### Sprint 2 (Weeks 3-4): Project Portfolio

**Goal:** Students can publish projects and browse the gallery.

| Ticket | Story | Points | Status |
|--------|-------|--------|--------|
| BSAH-010 | Build project creation form (US-2.1, US-2.2, US-2.3) | 8 | Done |
| BSAH-011 | Build project gallery with filters (US-2.5) | 5 | Done |
| BSAH-012 | Build project detail page (US-2.6) | 5 | Done |
| BSAH-013 | Add media/link attachments (US-2.4) | 2 | Done |
| BSAH-014 | Build comment system on projects (US-2.7) | 3 | Done |
| BSAH-015 | Wire up project CRUD to Prisma/PostgreSQL API routes | 5 | To Do |
| BSAH-016 | Add project view counter and engagement tracking | 3 | To Do |
| BSAH-017 | Build draft saving functionality (US-2.8) | 2 | To Do |
| **Total** | | **33** | |

### Sprint 3 (Weeks 5-6): Portfolio Pages & Community Feed

**Goal:** Students have shareable portfolios and can interact on the feed.

| Ticket | Story | Points | Status |
|--------|-------|--------|--------|
| BSAH-018 | Build portfolio edit page (US-1.4) | 3 | Done |
| BSAH-019 | Build public portfolio page (US-3.1, US-3.2) | 5 | Done |
| BSAH-020 | Build social feed with compose box and reactions (US-4.1, US-4.2) | 5 | Done |
| BSAH-021 | Build threaded comments on posts (US-4.3) | 3 | Done |
| BSAH-022 | Build channel browser and joining (US-4.5) | 3 | Done |
| BSAH-023 | Wire up feed/post/reaction CRUD to API routes | 5 | To Do |
| BSAH-024 | Wire up portfolio data to real user queries | 3 | To Do |
| BSAH-025 | Add feed category filtering (US-4.4) | 2 | Done |
| **Total** | | **29** | |

### Sprint 4 (Weeks 7-8): Peer Review & Messaging

**Goal:** Students can review each other's work and message privately.

| Ticket | Story | Points | Status |
|--------|-------|--------|--------|
| BSAH-026 | Build peer review hub (US-5.1, US-5.2, US-5.3) | 8 | Done |
| BSAH-027 | Build messaging interface (US-6.1, US-6.2) | 5 | Done |
| BSAH-028 | Wire up review submission to API/DB | 5 | To Do |
| BSAH-029 | Wire up messaging to API/DB with real-time updates | 5 | To Do |
| BSAH-030 | Add reviewer reputation tracking (US-5.4) | 3 | To Do |
| BSAH-031 | Build notification system for messages and reviews | 5 | To Do |
| **Total** | | **31** | |

### Sprint 5 (Weeks 9-10): Career Launchpad

**Goal:** Students can discover jobs, track applications, and build resumes.

| Ticket | Story | Points | Status |
|--------|-------|--------|--------|
| BSAH-032 | Build job board with filters (US-7.1, US-7.2) | 5 | Done |
| BSAH-033 | Build application tracker Kanban (US-7.3, US-7.4) | 5 | Done |
| BSAH-034 | Build resume builder with live preview (US-8.1, US-8.2, US-8.3) | 8 | Done |
| BSAH-035 | Build interview prep hub (US-9.1, US-9.2, US-9.5) | 5 | Done |
| BSAH-036 | Wire up job/application CRUD to API/DB | 5 | To Do |
| BSAH-037 | Wire up resume data persistence | 3 | To Do |
| BSAH-038 | Add alumni job posting capability (US-7.6) | 3 | To Do |
| BSAH-039 | Add PDF export for resume (US-8.4) | 5 | To Do |
| **Total** | | **39** | |

### Sprint 6 (Weeks 11-12): Growth & Learning

**Goal:** Students can follow learning paths, compete in challenges, and learn from tutorials.

| Ticket | Story | Points | Status |
|--------|-------|--------|--------|
| BSAH-040 | Build learning paths page (US-10.1, US-10.2) | 5 | Done |
| BSAH-041 | Build challenge board with leaderboard (US-10.3, US-10.6) | 5 | Done |
| BSAH-042 | Build tutorials page (US-11.1) | 3 | Done |
| BSAH-043 | Build certification tracker (US-11.4) | 3 | Done |
| BSAH-044 | Wire up challenge submissions and voting (US-10.4, US-10.5) | 5 | To Do |
| BSAH-045 | Wire up tutorial CRUD and rating | 5 | To Do |
| BSAH-046 | Add learning path progress tracking to DB | 5 | To Do |
| BSAH-047 | Build tutorial creation form (US-11.2) | 5 | To Do |
| **Total** | | **36** | |

### Sprint 7 (Weeks 13-14): Alumni Network & Events

**Goal:** Students can connect with alumni mentors and RSVP to events.

| Ticket | Story | Points | Status |
|--------|-------|--------|--------|
| BSAH-048 | Build alumni directory (US-12.1, US-12.2) | 5 | Done |
| BSAH-049 | Build mentor matching (US-12.3, US-12.4) | 5 | Done |
| BSAH-050 | Build events calendar (US-13.1, US-13.2) | 5 | Done |
| BSAH-051 | Wire up alumni/mentor data to API/DB | 5 | To Do |
| BSAH-052 | Wire up event RSVP system to API/DB | 3 | To Do |
| BSAH-053 | Add referral pipeline for alumni (US-12.7) | 3 | To Do |
| BSAH-054 | Add calendar sync export (US-13.4) | 3 | To Do |
| **Total** | | **29** | |

### Sprint 8 (Weeks 15-16): AI, Metrics & Polish

**Goal:** Platform intelligence, weekly digest, and production readiness.

| Ticket | Story | Points | Status |
|--------|-------|--------|--------|
| BSAH-055 | Build weekly digest generation with Claude API (US-14.1, US-14.3) | 8 | To Do |
| BSAH-056 | Build Career Readiness Score calculation (US-15.1) | 5 | To Do |
| BSAH-057 | Build suggested actions engine (US-15.2) | 3 | To Do |
| BSAH-058 | Build opt-in leaderboard (US-15.3) | 3 | To Do |
| BSAH-059 | Add PDF portfolio export (US-3.4) | 5 | To Do |
| BSAH-060 | Mobile-responsive audit and fixes | 5 | To Do |
| BSAH-061 | Performance optimization (lazy loading, image optimization) | 3 | To Do |
| BSAH-062 | Security audit (input sanitization, CSRF, rate limiting) | 5 | To Do |
| BSAH-063 | Build faculty admin analytics dashboard (US-15.4) | 8 | To Do |
| **Total** | | **45** | |

### Velocity Summary

| Sprint | Points | Theme |
|--------|--------|-------|
| Sprint 1 | 36 | Foundation & Auth |
| Sprint 2 | 33 | Project Portfolio |
| Sprint 3 | 29 | Portfolios & Feed |
| Sprint 4 | 31 | Reviews & Messaging |
| Sprint 5 | 39 | Career Launchpad |
| Sprint 6 | 36 | Growth & Learning |
| Sprint 7 | 29 | Alumni & Events |
| Sprint 8 | 45 | AI, Metrics & Polish |
| **Total** | **278** | |

---

## 6. Issue Tracker

### Open Issues

| Issue ID | Title | Type | Priority | Sprint | Status |
|----------|-------|------|----------|--------|--------|
| ISS-001 | All pages use mock data instead of real database queries | Backend | P0 | 2-7 | Open |
| ISS-002 | API routes needed for all CRUD operations | Backend | P0 | 2 | Open |
| ISS-003 | PostgreSQL database not provisioned for deployment | Infrastructure | P0 | 2 | Open |
| ISS-004 | File upload system (S3) not implemented | Backend | P1 | 3 | Open |
| ISS-005 | WebSocket server needed for real-time feed and messaging | Backend | P1 | 4 | Open |
| ISS-006 | Email service (SendGrid) not configured for notifications/digest | Backend | P1 | 8 | Open |
| ISS-007 | Bryant SSO (SAML) integration not implemented | Auth | P1 | 2 | Open |
| ISS-008 | Search is client-side only; need server-side full-text search | Backend | P1 | 3 | Open |
| ISS-009 | No input sanitization on form submissions | Security | P0 | 2 | Open |
| ISS-010 | No rate limiting on API routes | Security | P1 | 8 | Open |
| ISS-011 | Resume PDF export not functional | Feature | P1 | 5 | Open |
| ISS-012 | Portfolio PDF export not functional | Feature | P2 | 8 | Open |
| ISS-013 | Kanban drag-and-drop not implemented (applications tracker) | Feature | P1 | 5 | Open |
| ISS-014 | Calendar sync (.ics export) not implemented | Feature | P2 | 7 | Open |
| ISS-015 | Mobile responsiveness needs audit | UI | P1 | 8 | Open |
| ISS-016 | Role-based route protection not enforced (middleware) | Security | P0 | 2 | Open |
| ISS-017 | Image/avatar upload not functional | Feature | P2 | 3 | Open |
| ISS-018 | Claude API integration for AI features not implemented | Feature | P2 | 8 | Open |
| ISS-019 | Notification system (in-app + email) not implemented | Feature | P1 | 4 | Open |
| ISS-020 | Redis caching layer not set up | Infrastructure | P2 | 8 | Open |
| ISS-021 | CI/CD pipeline (GitHub Actions) not configured | Infrastructure | P1 | 8 | Open |
| ISS-022 | WCAG 2.1 AA accessibility audit needed | Accessibility | P1 | 8 | Open |
| ISS-023 | FERPA compliance review for student data handling | Compliance | P1 | 2 | Open |
| ISS-024 | Seed script needed for demo/development data | DX | P1 | 2 | Open |
| ISS-025 | Error boundaries and 404/500 pages not implemented | UI | P1 | 3 | Open |

### Closed Issues

| Issue ID | Title | Type | Resolution |
|----------|-------|------|-----------|
| ISS-C01 | ESM/CommonJS conflict in package.json | Build | Removed `"type": "commonjs"` |
| ISS-C02 | Prisma 7 incompatible config format | Build | Downgraded to Prisma 6 |
| ISS-C03 | `Linkedin` and `Github` icons missing from lucide-react | Build | Replaced with `ExternalLink` and `Code` |
| ISS-C04 | Prisma schema `password` field mismatch | Build | Fixed to `passwordHash` |

---

## 7. User Testing Plan

### 7.1 Testing Phases

| Phase | Timing | Participants | Focus |
|-------|--------|-------------|-------|
| Alpha | Sprint 3 end | 5 sports analytics students + 1 faculty | Core flow: register → create project → browse gallery → view portfolio |
| Beta | Sprint 5 end | 15 students + 3 faculty + 2 alumni | Full flow including feed, reviews, job board, resume builder |
| UAT | Sprint 7 end | 30+ students + faculty + alumni + 1 recruiter | All features; real content; stress testing |
| Launch | Sprint 8 end | Full cohort | Production deployment with monitoring |

### 7.2 User Test Scripts

#### Test 1: Onboarding & Profile Setup
**Participants:** 5 new students
**Duration:** 15 minutes
**Pre-condition:** No account exists

| Step | Task | Pass Criteria | Observe |
|------|------|--------------|---------|
| 1 | Navigate to the landing page | Page loads with hero and CTAs | First impression, clarity of value proposition |
| 2 | Click "Get Started" and register | Registration form completes; redirected to dashboard | Friction points in form; field confusion |
| 3 | Edit your profile: add bio, headline, LinkedIn URL, skills | All fields save; visible on portfolio preview | Do they find the edit page? Do they understand each field? |
| 4 | Navigate to your public portfolio page | Portfolio renders with entered data | Reaction to portfolio design; shareable URL clarity |
| 5 | Return to dashboard | Dashboard shows stats and suggestions | Do they understand the Career Readiness Score? |

**Post-test questions:**
- What is this platform for? (Comprehension check)
- Would you share your portfolio URL on LinkedIn? Why/why not?
- What would you do next?

#### Test 2: Project Publishing Flow
**Participants:** 5 students with existing analytics work
**Duration:** 20 minutes
**Pre-condition:** Authenticated account

| Step | Task | Pass Criteria | Observe |
|------|------|--------------|---------|
| 1 | Navigate to Projects → New Project | Form loads with all sections | Navigation clarity; can they find "New Project"? |
| 2 | Fill in title, abstract, and content for a real project you've done | Text fields accept input; markdown renders | Content entry experience; do they use markdown? |
| 3 | Select sport, technique, and tool tags | Checkboxes work; selections persist | Are the tag options comprehensive enough? |
| 4 | Set visibility to Public and publish | Project appears in gallery with correct tags | Publish confirmation; any confusion about visibility? |
| 5 | Find your project in the gallery using filters | Filters narrow results; project appears | Filter usability; did the correct tags make it findable? |
| 6 | View your project's detail page | All content renders; sidebar shows author info | Content presentation; does it look professional? |
| 7 | Mark your project as "Open for Review" | Toggle activates; project appears in review queue | Do they understand what peer review means here? |

**Post-test questions:**
- How does this compare to how you currently share your work?
- What tags or categories are missing?
- Would a hiring manager be impressed seeing this?

#### Test 3: Community Engagement
**Participants:** 8 students (mix of new and returning)
**Duration:** 15 minutes
**Pre-condition:** Authenticated; at least 3 projects exist

| Step | Task | Pass Criteria | Observe |
|------|------|--------------|---------|
| 1 | Post a question about a sports analytics technique on the feed | Post appears in feed with correct author info | Compose box usability; do they add tags? |
| 2 | React to 2 other posts (use different reaction types) | Reactions toggle; counts update | Do they understand the 4 reaction types? |
| 3 | Leave a comment on someone's project | Comment appears with threading | Threading clarity; reply button findability |
| 4 | Join the #nfl-analytics channel | Join button toggles; channel accessible | Channel discovery; do they browse other channels? |
| 5 | Write a peer review on an open project | Review form completes; scores and feedback submitted | Scoring rubric clarity; time to complete review |

**Post-test questions:**
- Would you check this feed daily? What would bring you back?
- Was the peer review rubric clear?
- What's missing from the community features?

#### Test 4: Career Features
**Participants:** 5 students actively job-seeking
**Duration:** 20 minutes
**Pre-condition:** Authenticated account

| Step | Task | Pass Criteria | Observe |
|------|------|--------------|---------|
| 1 | Browse the job board; find an NBA analyst role | Filters work; relevant listing found | Filter usability; do they notice Bryant Connection badges? |
| 2 | Save a job and add it to your application tracker | Job appears in "Interested" column of Kanban | Save/Track button clarity |
| 3 | Move an application from "Interested" to "Applied" | Status updates; card moves to correct column | Kanban interaction; any confusion? |
| 4 | Open the resume builder and fill in 3 sections | Sections editable; preview updates live | Section naming clarity; do they like the template? |
| 5 | Browse interview prep questions; find a SQL challenge | Question found via filter; answer expandable | Question quality; difficulty calibration |

**Post-test questions:**
- Would you use this instead of a spreadsheet to track applications? Why/why not?
- What job sources are missing?
- How does the resume builder compare to what you use now?

#### Test 5: Alumni & Mentorship (Alumni Participants)
**Participants:** 3 alumni working in pro sports
**Duration:** 15 minutes
**Pre-condition:** Alumni account with profile completed

| Step | Task | Pass Criteria | Observe |
|------|------|--------------|---------|
| 1 | Review your alumni profile in the directory | Profile renders with current role, company, expertise | Is the profile information accurate and useful? |
| 2 | Accept a mentorship request from a student | Match status changes to Active | Notification clarity; commitment expectations |
| 3 | Post a job listing from your organization | Job form completes; listing appears with Bryant Connection badge | Form usability; do they want more fields? |
| 4 | Leave feedback on a student's project | Review form works; feedback visible to student | Is the rubric relevant for industry feedback? |
| 5 | Browse 3 student portfolios | Portfolios load; projects visible | Would they share a student's portfolio with their hiring manager? |

**Post-test questions:**
- Would you engage with this platform monthly? What would bring you back?
- What would make you more likely to refer a Bryant student?
- Any concerns about time commitment?

### 7.3 Metrics to Collect During Testing

| Metric | Tool | Target |
|--------|------|--------|
| Task completion rate | Manual observation | >90% for P0 flows |
| Time on task | Stopwatch | <3 min for core actions |
| Error rate | Manual observation | <5% for critical paths |
| System Usability Scale (SUS) | Post-test survey | >75 (above average) |
| Net Promoter Score (NPS) | Post-test survey | >50 |
| Findability (can users locate features?) | First-click analysis | >80% correct first click |

### 7.4 Accessibility Testing

| Test | Tool/Method | Standard |
|------|-------------|----------|
| Keyboard navigation | Manual tabbing through all pages | All interactive elements reachable |
| Screen reader | NVDA or VoiceOver on 5 key pages | All content announced; ARIA labels present |
| Color contrast | Lighthouse or axe DevTools | WCAG 2.1 AA (4.5:1 text, 3:1 UI) |
| Focus indicators | Visual inspection | All focused elements have visible ring |
| Zoom | 200% browser zoom on all pages | No content clipped or overlapping |

---

## 8. Non-Functional Requirements

### 8.1 Performance

| Requirement | Target |
|-------------|--------|
| Page load (LCP) | < 2.0 seconds |
| Time to interactive (TTI) | < 3.0 seconds |
| First contentful paint (FCP) | < 1.0 seconds |
| API response time (p95) | < 500ms |
| Feed real-time update latency | < 1 second |
| Lighthouse performance score | > 85 |

### 8.2 Security

| Requirement | Implementation |
|-------------|---------------|
| Authentication | NextAuth with JWT sessions; bcrypt password hashing |
| Authorization | Role-based middleware on all protected routes |
| Data validation | Server-side validation on all API inputs; Zod schemas |
| XSS prevention | React auto-escaping; sanitize user HTML/markdown |
| CSRF protection | NextAuth built-in CSRF tokens |
| Rate limiting | Express rate limiter on API routes (100 req/min/user) |
| HTTPS | Enforced via deployment platform |
| File upload validation | File type whitelist; max size 25MB; virus scanning |
| SQL injection | Prisma parameterized queries (built-in) |
| FERPA compliance | Student data access restricted by role; no public PII without consent |

### 8.3 Scalability

| Dimension | Target |
|-----------|--------|
| Concurrent users | 200 |
| Total registered users | 500 |
| Projects stored | 5,000 |
| Posts per day | 100 |
| File storage | 50 GB |
| Database size | 10 GB |

### 8.4 Availability

| Requirement | Target |
|-------------|--------|
| Uptime | 99.5% (excluding planned maintenance) |
| Recovery time objective (RTO) | < 4 hours |
| Recovery point objective (RPO) | < 1 hour |
| Backup frequency | Daily automated PostgreSQL backups |

### 8.5 Browser Support

| Browser | Versions |
|---------|----------|
| Chrome | Last 2 major |
| Firefox | Last 2 major |
| Safari | Last 2 major |
| Edge | Last 2 major |
| Mobile Safari (iOS) | Last 2 major |
| Chrome (Android) | Last 2 major |

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Low student adoption | Medium | High | Integrate with existing coursework (ISA 340); faculty endorsement; make project submission a class requirement |
| Alumni disengagement | High | Medium | Minimize time commitment (async mentorship option); spotlight features give alumni visibility |
| Database not provisioned before Sprint 2 | Medium | High | Use SQLite for local dev; provision Supabase or Railway PostgreSQL by Sprint 2 kickoff |
| NextAuth beta instability | Low | Medium | Pin version; have fallback to stable v4 if needed |
| Scope creep from AI features | Medium | Medium | AI features are P2/P3; deliver core platform first; AI is additive polish |
| FERPA compliance gaps | Medium | High | Engage Bryant IT/legal in Sprint 2; visibility defaults to Bryant-only; no public PII without explicit consent |
| Poor mobile experience | Medium | Medium | Mobile-first CSS; responsive audit in Sprint 8; test on real devices |
| Single developer bottleneck | High | High | Comprehensive documentation; modular architecture; clear API contracts for parallel work |

---

## 10. Definition of Done

A feature is "Done" when all of the following are true:

- [ ] Code compiles with zero TypeScript errors
- [ ] Feature matches the acceptance criteria in the user story
- [ ] API routes validate all inputs server-side
- [ ] Data persists to PostgreSQL via Prisma (not just mock data)
- [ ] UI is responsive on mobile, tablet, and desktop breakpoints
- [ ] Keyboard navigation works for all interactive elements
- [ ] No console errors or warnings in development
- [ ] Code follows existing patterns (component structure, naming, styling)
- [ ] Edge cases handled (empty states, error states, loading states)
- [ ] Feature tested by at least one person who did not write the code
- [ ] No known security vulnerabilities introduced
- [ ] Git commit with descriptive message on feature branch
