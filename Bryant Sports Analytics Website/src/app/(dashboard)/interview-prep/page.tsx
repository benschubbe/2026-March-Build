"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  BookOpen,
  Code,
  Brain,
  Users,
  Video,
  Calendar,
  MessageSquare,
  Plus,
  Clock,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

/* ================================================================
   QUESTION BANK
   ================================================================ */

type Difficulty = "Easy" | "Medium" | "Hard";
type QuestionCategory =
  | "SQL"
  | "Probability & Stats"
  | "Case Studies"
  | "Programming"
  | "Behavioral";

interface Question {
  id: string;
  text: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  votes: number;
  answer: string;
  userVote: 0 | 1 | -1;
}

const INITIAL_QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "Write a SQL query to find the top 5 scorers per team in the current NBA season.",
    category: "SQL",
    difficulty: "Medium",
    votes: 42,
    answer:
      "Use a window function: SELECT player_name, team, points_per_game, RANK() OVER (PARTITION BY team ORDER BY points_per_game DESC) as rnk FROM player_stats WHERE season = '2025-26' QUALIFY rnk <= 5 ORDER BY team, rnk;",
    userVote: 0,
  },
  {
    id: "q2",
    text: "A batter has a .300 batting average. What is the probability of going hitless in 4 at-bats?",
    category: "Probability & Stats",
    difficulty: "Easy",
    votes: 38,
    answer:
      "P(0 hits in 4 AB) = (1 - 0.300)^4 = 0.700^4 = 0.2401, or about 24%. This assumes independence between at-bats, which is a common simplifying assumption in baseball analytics.",
    userVote: 0,
  },
  {
    id: "q3",
    text: "How would you build a win probability model for an NFL game?",
    category: "Case Studies",
    difficulty: "Hard",
    votes: 56,
    answer:
      "Start with historical play-by-play data (nflfastR). Features include: score differential, time remaining, field position, down and distance, timeouts remaining, and home/away. Use logistic regression or gradient boosted trees. Train on 10+ seasons of data, validate with held-out seasons. Key consideration: the model should be calibrated so that predicted probabilities match observed win rates. You can evaluate using Brier score and calibration plots.",
    userVote: 0,
  },
  {
    id: "q4",
    text: "Design a system to track real-time player performance during a live NBA game.",
    category: "Programming",
    difficulty: "Hard",
    votes: 34,
    answer:
      "Architecture: Ingest tracking data from Second Spectrum via streaming API (Kafka). Process with Spark Streaming to compute real-time metrics (speed, distance, spacing). Store in a time-series database (InfluxDB/TimescaleDB). Build a dashboard layer with WebSockets for live updates. Key metrics: player speed, defensive matchups, shot quality (expected eFG%), spacing metrics. Considerations: latency requirements (<1s), data volume (~25 frames/sec per player), fault tolerance.",
    userVote: 0,
  },
  {
    id: "q5",
    text: "Tell me about a project where your analysis changed someone's decision.",
    category: "Behavioral",
    difficulty: "Medium",
    votes: 29,
    answer:
      "Use the STAR method: Situation (context of the project), Task (what you needed to deliver), Action (specific analysis you performed), Result (the decision that changed and its outcome). Good examples include: changing a coach's rotation strategy, influencing a fantasy draft strategy, or presenting data that shifted a marketing budget allocation.",
    userVote: 0,
  },
  {
    id: "q6",
    text: "Write a SQL query to calculate a player's rolling 10-game batting average.",
    category: "SQL",
    difficulty: "Medium",
    votes: 31,
    answer:
      "SELECT player_id, game_date, hits, at_bats, SUM(hits) OVER (PARTITION BY player_id ORDER BY game_date ROWS BETWEEN 9 PRECEDING AND CURRENT ROW) * 1.0 / NULLIF(SUM(at_bats) OVER (PARTITION BY player_id ORDER BY game_date ROWS BETWEEN 9 PRECEDING AND CURRENT ROW), 0) AS rolling_avg FROM game_logs ORDER BY player_id, game_date;",
    userVote: 0,
  },
  {
    id: "q7",
    text: "Explain the difference between expected goals (xG) and actual goals in soccer. Why might they diverge?",
    category: "Probability & Stats",
    difficulty: "Easy",
    votes: 25,
    answer:
      "xG measures the quality of chances created based on shot location, type, and context. Actual goals can diverge due to: finishing skill (elite strikers consistently outperform xG), small sample sizes, goalkeeper quality, luck/variance, and game state effects. Over large samples, persistent overperformance may indicate true finishing talent, while underperformance may suggest poor finishing or bad luck.",
    userVote: 0,
  },
  {
    id: "q8",
    text: "A team asks you to evaluate whether their new defensive scheme is working. How do you approach this?",
    category: "Case Studies",
    difficulty: "Medium",
    votes: 33,
    answer:
      "1) Define success metrics (points allowed, opponent FG%, defensive rating, opponent EPA). 2) Establish a baseline using pre-scheme data. 3) Compare post-scheme metrics, controlling for opponent quality (strength of schedule adjustment). 4) Use statistical tests to determine significance. 5) Supplement with tracking data: contest rates, closeout speed, help defense frequency. 6) Account for confounders: roster changes, injuries, schedule difficulty. Present findings with confidence intervals, not just point estimates.",
    userVote: 0,
  },
  {
    id: "q9",
    text: "Write a Python function that simulates an NBA game using basic team statistics.",
    category: "Programming",
    difficulty: "Medium",
    votes: 27,
    answer:
      "def simulate_game(team_a_ortg, team_a_pace, team_b_ortg, team_b_pace, league_avg_ortg=110, league_avg_pace=100):\n    import random\n    pace = (team_a_pace + team_b_pace) / 2\n    possessions = int(pace * 0.96)  # ~48 min game\n    a_pts_per_poss = team_a_ortg / 100\n    b_pts_per_poss = team_b_ortg / 100\n    a_score = sum(random.random() < a_pts_per_poss/1.1 for _ in range(possessions))\n    b_score = sum(random.random() < b_pts_per_poss/1.1 for _ in range(possessions))\n    return {'team_a': a_score, 'team_b': b_score}",
    userVote: 0,
  },
  {
    id: "q10",
    text: "How would you handle a situation where your data contradicts a coach's intuition?",
    category: "Behavioral",
    difficulty: "Easy",
    votes: 44,
    answer:
      "Key principles: 1) Respect their expertise - coaches have context that data may not capture. 2) Present findings as supplementary information, not a directive. 3) Visualize the data clearly and let it tell the story. 4) Acknowledge limitations and uncertainty in your analysis. 5) Find common ground by starting with areas where data and intuition agree. 6) Be willing to iterate - maybe the data is incomplete or the model needs refinement.",
    userVote: 0,
  },
  {
    id: "q11",
    text: "Given a table of play-by-play data, write a query to find which quarterback has the highest EPA per play on 3rd down.",
    category: "SQL",
    difficulty: "Hard",
    votes: 22,
    answer:
      "SELECT qb_name, COUNT(*) as plays, ROUND(AVG(epa), 3) as epa_per_play FROM play_by_play WHERE down = 3 AND qb_name IS NOT NULL AND season = 2025 GROUP BY qb_name HAVING COUNT(*) >= 50 ORDER BY epa_per_play DESC LIMIT 10;",
    userVote: 0,
  },
  {
    id: "q12",
    text: "Explain the concept of Pythagorean wins and when it might be misleading.",
    category: "Probability & Stats",
    difficulty: "Medium",
    votes: 19,
    answer:
      "Pythagorean wins estimate expected win% based on points scored vs. allowed: Win% = PF^k / (PF^k + PA^k). In baseball k~1.83, basketball k~13.91, football k~2.37. It can be misleading when: teams have extreme records in close games (clutch/anti-clutch), when there are significant roster changes mid-season, or when a team's point differential is driven by blowouts rather than consistent performance. It is a better predictor of future performance than actual record.",
    userVote: 0,
  },
];

const CATEGORY_OPTIONS = [
  "All",
  "SQL",
  "Probability & Stats",
  "Case Studies",
  "Programming",
  "Behavioral",
];

/* ================================================================
   MOCK INTERVIEWS
   ================================================================ */

interface MockInterview {
  id: string;
  type: string;
  partner: string;
  date: string;
  time: string;
  status: "upcoming" | "completed";
  feedback?: string;
}

const MOCK_INTERVIEWS: MockInterview[] = [
  {
    id: "mi1",
    type: "SQL",
    partner: "Alex Rivera (Alumni - Sportradar)",
    date: "2026-04-05",
    time: "3:00 PM",
    status: "upcoming",
  },
  {
    id: "mi2",
    type: "Case Study",
    partner: "Jordan Kim (Peer)",
    date: "2026-04-08",
    time: "7:00 PM",
    status: "upcoming",
  },
  {
    id: "mi3",
    type: "Full Loop",
    partner: "Dr. Sarah Chen (Faculty Advisor)",
    date: "2026-03-15",
    time: "2:00 PM",
    status: "completed",
    feedback:
      "Strong SQL skills. Work on explaining your thought process more clearly during case studies. Good use of frameworks but practice quantifying impact. Consider preparing 2-3 specific project stories using the STAR method.",
  },
  {
    id: "mi4",
    type: "SQL",
    partner: "Marcus Thompson (Peer)",
    date: "2026-03-01",
    time: "6:00 PM",
    status: "completed",
    feedback:
      "Solid window function knowledge. Practice CTEs for more complex multi-step queries. Time management was good.",
  },
];

const INTERVIEW_TYPE_OPTIONS = [
  { value: "sql", label: "SQL" },
  { value: "case", label: "Case Study" },
  { value: "full", label: "Full Loop" },
];

/* ================================================================
   READING LIST
   ================================================================ */

type ReadingCategory =
  | "Must-Read Papers"
  | "Key Blog Posts"
  | "Essential Books"
  | "Conference Talks";

interface ReadingItem {
  id: string;
  title: string;
  author: string;
  category: ReadingCategory;
  description: string;
  url: string;
}

const READING_LIST: ReadingItem[] = [
  {
    id: "r1",
    title: "Expected Points and EPA Explained",
    author: "Ben Baldwin",
    category: "Key Blog Posts",
    description:
      "The definitive explainer on Expected Points Added, the foundational metric for modern NFL analytics. Covers methodology, interpretation, and applications for evaluating quarterback and team performance.",
    url: "#",
  },
  {
    id: "r2",
    title: "Statcast Primer: Baseball Savant Guide",
    author: "MLB / Baseball Savant",
    category: "Key Blog Posts",
    description:
      "Comprehensive introduction to Statcast metrics including exit velocity, launch angle, sprint speed, and spin rate. Essential reading for anyone working with modern baseball data.",
    url: "#",
  },
  {
    id: "r3",
    title: "The Book: Playing the Percentages in Baseball",
    author: "Tom Tango, Mitchel Lichtman, Andrew Dolphin",
    category: "Essential Books",
    description:
      "A rigorous statistical analysis of baseball strategy covering platoon splits, lineup construction, pitching changes, sacrifice bunts, and base-stealing. The gold standard for evidence-based baseball analysis.",
    url: "#",
  },
  {
    id: "r4",
    title: "Thinking Basketball",
    author: "Ben Taylor",
    category: "Essential Books",
    description:
      "Explores the cognitive side of basketball analytics, covering how thinking and decision-making drive winning. Challenges conventional stats with more nuanced approaches to measuring basketball impact.",
    url: "#",
  },
  {
    id: "r5",
    title: "SprawlBall: A Visual Tour of the New Era of the NBA",
    author: "Kirk Goldsberry",
    category: "Essential Books",
    description:
      "Kirk Goldsberry's pioneering court mapping and shot chart visualizations that transformed how we understand spatial patterns in basketball. Beautiful data visualization meets basketball analysis.",
    url: "#",
  },
  {
    id: "r6",
    title: "A Starting Point for Analyzing Basketball Statistics",
    author: "Dean Oliver",
    category: "Must-Read Papers",
    description:
      "Dean Oliver's Four Factors framework for understanding team performance: shooting (eFG%), turnovers, rebounding, and free throws. Foundational work that underpins modern basketball analytics.",
    url: "#",
  },
  {
    id: "r7",
    title: "SLOAN Sports Analytics Conference Talks",
    author: "MIT Sloan",
    category: "Conference Talks",
    description:
      "Archive of presentations from the premier sports analytics conference. Covers cutting-edge research across all major sports, from player tracking to injury prediction to fan engagement.",
    url: "#",
  },
  {
    id: "r8",
    title: "Moneyball: The Art of Winning an Unfair Game",
    author: "Michael Lewis",
    category: "Essential Books",
    description:
      "The book that brought sports analytics into mainstream consciousness. Chronicles the Oakland A's use of sabermetrics to compete against wealthier teams. Essential cultural context for the field.",
    url: "#",
  },
  {
    id: "r9",
    title: "Introducing Expected Threat (xT)",
    author: "Karun Singh",
    category: "Key Blog Posts",
    description:
      "Groundbreaking framework for valuing ball progression in soccer by assigning threat values to every location on the pitch. Widely adopted by clubs and analytics departments worldwide.",
    url: "#",
  },
  {
    id: "r10",
    title: "The Athletic's Introduction to WAR",
    author: "Jay Jaffe / The Athletic",
    category: "Key Blog Posts",
    description:
      "Thorough explainer of Wins Above Replacement, the catch-all metric used across baseball analytics. Covers the differences between bWAR and fWAR and how to interpret the stat correctly.",
    url: "#",
  },
];

const READING_CATEGORIES: ReadingCategory[] = [
  "Must-Read Papers",
  "Key Blog Posts",
  "Essential Books",
  "Conference Talks",
];

/* ================================================================
   Component helpers
   ================================================================ */

function difficultyColor(d: Difficulty) {
  if (d === "Easy") return "bg-green-100 text-green-800";
  if (d === "Medium") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

function categoryIcon(cat: QuestionCategory) {
  if (cat === "SQL") return <Code className="h-3.5 w-3.5" />;
  if (cat === "Probability & Stats") return <Brain className="h-3.5 w-3.5" />;
  if (cat === "Case Studies") return <BookOpen className="h-3.5 w-3.5" />;
  if (cat === "Programming") return <Code className="h-3.5 w-3.5" />;
  return <Users className="h-3.5 w-3.5" />;
}

function readingBadgeVariant(cat: ReadingCategory) {
  const map: Record<ReadingCategory, "sport" | "technique" | "tool" | "domain"> = {
    "Must-Read Papers": "technique",
    "Key Blog Posts": "sport",
    "Essential Books": "tool",
    "Conference Talks": "domain",
  };
  return map[cat];
}

/* ================================================================
   PAGE
   ================================================================ */

export default function InterviewPrepPage() {
  const [activeTab, setActiveTab] = useState("questions");

  /* Question Bank state */
  const [questions, setQuestions] = useState(INITIAL_QUESTIONS);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(
    new Set()
  );

  /* Mock Interview state */
  const [interviews] = useState(MOCK_INTERVIEWS);
  const [mockType, setMockType] = useState("sql");
  const [mockPartner, setMockPartner] = useState("");
  const [mockDate, setMockDate] = useState("");

  /* Reading List state */
  const [readingFilter, setReadingFilter] = useState<ReadingCategory | "All">(
    "All"
  );

  /* ---- question bank handlers ---- */
  function toggleAnswer(id: string) {
    setExpandedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function vote(id: string, direction: 1 | -1) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const alreadyVoted = q.userVote === direction;
        return {
          ...q,
          votes: q.votes - q.userVote + (alreadyVoted ? 0 : direction),
          userVote: alreadyVoted ? 0 : direction,
        };
      })
    );
  }

  const filteredQuestions =
    categoryFilter === "All"
      ? questions
      : questions.filter((q) => q.category === categoryFilter);

  const filteredReadings =
    readingFilter === "All"
      ? READING_LIST
      : READING_LIST.filter((r) => r.category === readingFilter);

  const upcomingInterviews = interviews.filter(
    (i) => i.status === "upcoming"
  );
  const pastInterviews = interviews.filter((i) => i.status === "completed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-bryant-gray-900">
          Interview Prep
        </h1>
        <p className="mt-1 text-sm text-bryant-gray-500">
          Practice questions, schedule mock interviews, and build your knowledge
        </p>
      </div>

      {/* Tabs */}
      <Tabs activeTab={activeTab} onTabChange={setActiveTab}>
        <TabList>
          <Tab value="questions">Question Bank</Tab>
          <Tab value="mock">Mock Interviews</Tab>
          <Tab value="reading">Reading List</Tab>
        </TabList>

        {/* ============ QUESTION BANK ============ */}
        <TabPanel value="questions">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  categoryFilter === cat
                    ? "bg-bryant-gold text-white"
                    : "bg-bryant-gray-100 text-bryant-gray-700 hover:bg-bryant-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {filteredQuestions.map((q) => (
              <Card key={q.id}>
                <CardContent className="py-5">
                  <div className="flex gap-4">
                    {/* Vote Column */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button
                        onClick={() => vote(q.id, 1)}
                        className={`p-1 rounded transition-colors ${
                          q.userVote === 1
                            ? "text-bryant-gold"
                            : "text-bryant-gray-400 hover:text-bryant-gray-600"
                        }`}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-semibold text-bryant-gray-700">
                        {q.votes}
                      </span>
                      <button
                        onClick={() => vote(q.id, -1)}
                        className={`p-1 rounded transition-colors ${
                          q.userVote === -1
                            ? "text-red-500"
                            : "text-bryant-gray-400 hover:text-bryant-gray-600"
                        }`}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="default">
                          {categoryIcon(q.category)}
                          <span className="ml-1">{q.category}</span>
                        </Badge>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColor(q.difficulty)}`}
                        >
                          {q.difficulty}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-bryant-gray-900">
                        {q.text}
                      </p>

                      {/* Expandable Answer */}
                      <div className="mt-3">
                        <button
                          onClick={() => toggleAnswer(q.id)}
                          className="flex items-center gap-1 text-sm text-bryant-gold hover:underline"
                        >
                          {expandedAnswers.has(q.id) ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              Hide Answer
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              Show Answer
                            </>
                          )}
                        </button>
                        {expandedAnswers.has(q.id) && (
                          <div className="mt-2 p-3 bg-bryant-gray-50 rounded-lg">
                            <p className="text-sm text-bryant-gray-700 whitespace-pre-wrap">
                              {q.answer}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3"
                            >
                              <MessageSquare className="h-4 w-4" />
                              Add Your Answer
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabPanel>

        {/* ============ MOCK INTERVIEWS ============ */}
        <TabPanel value="mock">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Schedule Form */}
            <Card className="lg:col-span-1">
              <CardContent className="py-5">
                <h3 className="text-sm font-semibold text-bryant-gray-900 mb-4">
                  Schedule a Mock Interview
                </h3>
                <div className="space-y-4">
                  <Select
                    label="Interview Type"
                    options={INTERVIEW_TYPE_OPTIONS}
                    value={mockType}
                    onChange={(e) => setMockType(e.target.value)}
                  />
                  <Input
                    label="Partner"
                    placeholder="Search for a student or mentor..."
                    value={mockPartner}
                    onChange={(e) => setMockPartner(e.target.value)}
                  />
                  <Input
                    label="Date & Time"
                    type="datetime-local"
                    value={mockDate}
                    onChange={(e) => setMockDate(e.target.value)}
                  />
                  <Button className="w-full">
                    <Calendar className="h-4 w-4" />
                    Request Session
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sessions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Upcoming */}
              <div>
                <h3 className="text-sm font-semibold text-bryant-gray-900 mb-3">
                  Upcoming Sessions
                </h3>
                {upcomingInterviews.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-sm text-bryant-gray-500">
                        No upcoming sessions. Schedule one to get started.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {upcomingInterviews.map((mi) => (
                      <Card key={mi.id}>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-bryant-gold/10 flex items-center justify-center">
                                <Video className="h-5 w-5 text-bryant-gold" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-bryant-gray-900">
                                  {mi.type} Interview
                                </p>
                                <p className="text-xs text-bryant-gray-500">
                                  with {mi.partner}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-sm font-medium text-bryant-gray-700">
                                  {formatDate(mi.date)}
                                </p>
                                <p className="text-xs text-bryant-gray-500">
                                  {mi.time}
                                </p>
                              </div>
                              <Button size="sm">Join</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Sessions */}
              <div>
                <h3 className="text-sm font-semibold text-bryant-gray-900 mb-3">
                  Past Sessions
                </h3>
                <div className="space-y-3">
                  {pastInterviews.map((mi) => (
                    <Card key={mi.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-bryant-gray-100 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-bryant-gray-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-bryant-gray-900">
                                  {mi.type} Interview
                                </p>
                                <p className="text-xs text-bryant-gray-500">
                                  with {mi.partner} on {formatDate(mi.date)}
                                </p>
                              </div>
                              <Badge variant="success">Completed</Badge>
                            </div>
                            {mi.feedback && (
                              <div className="mt-3 p-3 bg-bryant-gray-50 rounded-lg">
                                <p className="text-xs font-medium text-bryant-gray-700 mb-1">
                                  Feedback Received
                                </p>
                                <p className="text-sm text-bryant-gray-600">
                                  {mi.feedback}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        {/* ============ READING LIST ============ */}
        <TabPanel value="reading">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setReadingFilter("All")}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                readingFilter === "All"
                  ? "bg-bryant-gold text-white"
                  : "bg-bryant-gray-100 text-bryant-gray-700 hover:bg-bryant-gray-200"
              }`}
            >
              All
            </button>
            {READING_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setReadingFilter(cat)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  readingFilter === cat
                    ? "bg-bryant-gold text-white"
                    : "bg-bryant-gray-100 text-bryant-gray-700 hover:bg-bryant-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Reading Items */}
          <div className="space-y-4">
            {filteredReadings.map((item) => (
              <Card key={item.id}>
                <CardContent className="py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant={readingBadgeVariant(item.category)}>
                          {item.category}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-semibold text-bryant-gray-900">
                        {item.title}
                      </h3>
                      <p className="text-xs text-bryant-gray-500 mt-0.5">
                        by {item.author}
                      </p>
                      <p className="text-sm text-bryant-gray-600 mt-2">
                        {item.description}
                      </p>
                    </div>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                        Read
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
