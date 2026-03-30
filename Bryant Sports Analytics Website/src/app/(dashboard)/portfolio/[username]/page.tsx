"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Code,
  Globe,
  ExternalLink,
  Download,
  FolderOpen,
  MessageSquare,
  Award,
  Activity,
  Star,
  Trophy,
  BookOpen,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, timeAgo, truncate } from "@/lib/utils";

/* ================================================================
   MOCK DATA -- realistic Bryant student portfolio for Ben Schubbe
   ================================================================ */

const PROFILE = {
  name: "Ben Schubbe",
  username: "bschubbe",
  headline: "Data Science & Sports Analytics | Bryant University '26",
  bio: "Junior at Bryant University pursuing a B.S. in Data Science with a concentration in Sports Analytics. Passionate about applying machine learning and statistical modeling to NBA and NFL data. Currently exploring draft prospect evaluation models and player performance prediction systems.",
  classYear: 2026,
  concentration: "Data Science",
  linkedinUrl: "https://linkedin.com/in/benschubbe",
  githubUrl: "https://github.com/benschubbe",
  websiteUrl: "https://benschubbe.dev",
  skills: [
    "Python",
    "R",
    "SQL",
    "Tableau",
    "Machine Learning",
    "Web Scraping",
    "NBA Analytics",
    "NFL Analytics",
    "Statistical Modeling",
    "Pandas",
    "scikit-learn",
  ],
};

const STATS = {
  projects: 6,
  reviews: 14,
  challengeWins: 3,
  certifications: 3,
};

const PROJECTS = [
  {
    id: "p1",
    title: "NBA Draft 2025 Prospect Evaluator",
    description:
      "Built a machine learning pipeline using KNN, decision trees, and ensemble methods to evaluate 2025 NBA draft prospects. Features include advanced stat normalization, PER-based clustering, and a Tableau dashboard for scouting visualization.",
    sport: "Basketball",
    tags: ["Python", "scikit-learn", "Tableau", "KNN"],
    publishedAt: "2026-02-18",
    likes: 24,
    reviews: 5,
  },
  {
    id: "p2",
    title: "NFL Separation Metrics Analysis",
    description:
      "Analyzed wide receiver separation data across the 2024 NFL season using web-scraped tracking metrics. Applied logistic regression and lasso/ridge regularization to predict target share from route-running efficiency.",
    sport: "Football",
    tags: ["Python", "Pandas", "Logistic Regression", "Lasso"],
    publishedAt: "2026-01-10",
    likes: 18,
    reviews: 4,
  },
  {
    id: "p3",
    title: "NCAA Men's Basketball EDA Dashboard",
    description:
      "Exploratory data analysis of NCAA Division I men's basketball data covering team efficiency, pace, and shooting trends. Interactive Tableau workbook with filterable conference comparisons.",
    sport: "Basketball",
    tags: ["R", "Tableau", "EDA"],
    publishedAt: "2025-11-22",
    likes: 31,
    reviews: 7,
  },
  {
    id: "p4",
    title: "Player Performance Prediction with Decision Trees",
    description:
      "Compared decision tree, random forest, and gradient boosting models for predicting NBA player efficiency rating (PER) based on pre-draft combine measurements and college statistics.",
    sport: "Basketball",
    tags: ["Python", "Decision Trees", "Random Forest", "XGBoost"],
    publishedAt: "2025-10-05",
    likes: 15,
    reviews: 3,
  },
  {
    id: "p5",
    title: "NFL Quarterback Sentiment Tracker",
    description:
      "Built a Twitter/X sentiment analysis tool for NFL quarterbacks using NLP techniques. Tracked public sentiment shifts around game performance and off-field events.",
    sport: "Football",
    tags: ["Python", "NLP", "Sentiment Analysis", "Web Scraping"],
    publishedAt: "2025-09-14",
    likes: 22,
    reviews: 6,
  },
  {
    id: "p6",
    title: "NBA Clustering: Player Archetypes",
    description:
      "Applied K-means and hierarchical clustering to identify modern NBA player archetypes using per-36 minute statistics. Visualized clusters with PCA dimensionality reduction.",
    sport: "Basketball",
    tags: ["Python", "Clustering", "PCA", "Matplotlib"],
    publishedAt: "2025-07-30",
    likes: 19,
    reviews: 4,
  },
];

const REVIEWS = [
  {
    id: "r1",
    projectTitle: "March Madness Bracket Optimizer",
    projectAuthor: "Sarah Chen",
    scores: { methodology: 4, visualization: 5, insight: 4 },
    excerpt:
      "Excellent use of historical seed data and a creative application of Bayesian probability. The interactive bracket visualization is a standout. Consider adding confidence intervals to the upset predictions.",
    createdAt: "2026-03-12",
  },
  {
    id: "r2",
    projectTitle: "MLB Pitch Classification Model",
    projectAuthor: "James Rivera",
    scores: { methodology: 5, visualization: 4, insight: 5 },
    excerpt:
      "Really impressive feature engineering using Statcast spin-rate and movement data. The confusion matrix breakdown by pitch type was insightful. Would love to see how this performs on minor league data.",
    createdAt: "2026-02-25",
  },
  {
    id: "r3",
    projectTitle: "Soccer xG Model Comparison",
    projectAuthor: "Emily Nguyen",
    scores: { methodology: 4, visualization: 3, insight: 4 },
    excerpt:
      "Solid comparison of expected goals models. The shot location heatmaps could use more granularity and the Opta vs. StatsBomb comparison section was very informative.",
    createdAt: "2026-01-30",
  },
  {
    id: "r4",
    projectTitle: "Tennis Serve Advantage Analysis",
    projectAuthor: "Michael Torres",
    scores: { methodology: 3, visualization: 4, insight: 4 },
    excerpt:
      "Good surface-level analysis of serve speeds across surfaces. The methodology section could benefit from controlling for opponent ranking. Strong visualizations though.",
    createdAt: "2025-12-15",
  },
  {
    id: "r5",
    projectTitle: "Fantasy Football Points Predictor",
    projectAuthor: "Alex Johnson",
    scores: { methodology: 5, visualization: 5, insight: 5 },
    excerpt:
      "One of the best projects I have reviewed this semester. The LSTM approach for time-series prediction is well-executed and the interactive dashboard makes it immediately useful for fantasy managers.",
    createdAt: "2025-11-28",
  },
];

const CERTIFICATIONS = [
  {
    id: "c1",
    name: "Google Data Analytics Professional Certificate",
    provider: "Google",
    completedAt: "2025-05-15",
    verifyUrl: "https://coursera.org/verify/professional-cert/ABC123",
  },
  {
    id: "c2",
    name: "IBM Data Science Specialization",
    provider: "IBM",
    completedAt: "2025-08-20",
    verifyUrl: "https://coursera.org/verify/specialization/DEF456",
  },
  {
    id: "c3",
    name: "Tableau Desktop Specialist",
    provider: "Tableau",
    completedAt: "2025-11-10",
    verifyUrl: "https://verify.tableau.com/GHI789",
  },
];

const ACTIVITY_FEED = [
  { id: "a1", type: "project" as const, label: "Published NBA Draft 2025 Prospect Evaluator", date: "2026-02-18" },
  { id: "a2", type: "review" as const, label: "Reviewed March Madness Bracket Optimizer by Sarah Chen", date: "2026-03-12" },
  { id: "a3", type: "challenge" as const, label: "Won the Spring 2026 Prediction Challenge", date: "2026-03-01" },
  { id: "a4", type: "review" as const, label: "Reviewed MLB Pitch Classification Model by James Rivera", date: "2026-02-25" },
  { id: "a5", type: "project" as const, label: "Published NFL Separation Metrics Analysis", date: "2026-01-10" },
  { id: "a6", type: "certification" as const, label: "Earned Tableau Desktop Specialist certification", date: "2025-11-10" },
  { id: "a7", type: "project" as const, label: "Published NCAA Men's Basketball EDA Dashboard", date: "2025-11-22" },
  { id: "a8", type: "review" as const, label: "Reviewed Fantasy Football Points Predictor by Alex Johnson", date: "2025-11-28" },
  { id: "a9", type: "challenge" as const, label: "Won the Fall 2025 Data Viz Challenge", date: "2025-10-20" },
  { id: "a10", type: "certification" as const, label: "Earned IBM Data Science Specialization", date: "2025-08-20" },
  { id: "a11", type: "project" as const, label: "Published NBA Clustering: Player Archetypes", date: "2025-07-30" },
  { id: "a12", type: "challenge" as const, label: "Won the Summer 2025 ML Model Showdown", date: "2025-07-15" },
];

/* ================================================================
   COMPONENT
   ================================================================ */

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  project: <FolderOpen className="h-4 w-4 text-blue-500" />,
  review: <MessageSquare className="h-4 w-4 text-purple-500" />,
  challenge: <Trophy className="h-4 w-4 text-bryant-gold" />,
  certification: <Award className="h-4 w-4 text-green-600" />,
};

function ScoreStars({ score, max = 5 }: { score: number; max?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < score ? "fill-bryant-gold text-bryant-gold" : "text-bryant-gray-300"}`}
        />
      ))}
    </span>
  );
}

export default function PublicPortfolioPage() {
  const [activeTab, setActiveTab] = useState("projects");

  return (
    <div className="min-h-screen">
      {/* ---- HERO BANNER ---- */}
      <div className="bg-gradient-to-br from-bryant-black to-bryant-gray-900">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <Avatar name={PROFILE.name} size="xl" className="h-24 w-24 text-2xl ring-4 ring-bryant-gold/30" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{PROFILE.name}</h1>
              <p className="mt-1 text-lg text-bryant-gray-300">{PROFILE.headline}</p>
              <p className="mt-1 text-sm text-bryant-gray-400">
                Class of {PROFILE.classYear} &middot; {PROFILE.concentration}
              </p>

              {/* Link buttons */}
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                {PROFILE.linkedinUrl && (
                  <a href={PROFILE.linkedinUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-bryant-gray-600 text-bryant-gray-200 hover:bg-bryant-gray-800 hover:text-white">
                      <ExternalLink className="h-4 w-4" />
                      LinkedIn
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                )}
                {PROFILE.githubUrl && (
                  <a href={PROFILE.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-bryant-gray-600 text-bryant-gray-200 hover:bg-bryant-gray-800 hover:text-white">
                      <Code className="h-4 w-4" />
                      GitHub
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                )}
                {PROFILE.websiteUrl && (
                  <a href={PROFILE.websiteUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-bryant-gray-600 text-bryant-gray-200 hover:bg-bryant-gray-800 hover:text-white">
                      <Globe className="h-4 w-4" />
                      Website
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                )}
                <Button variant="outline" size="sm" className="border-bryant-gray-600 text-bryant-gray-200 hover:bg-bryant-gray-800 hover:text-white">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Bio */}
          <p className="mx-auto mt-6 max-w-3xl text-sm leading-relaxed text-bryant-gray-300 sm:mx-0">
            {PROFILE.bio}
          </p>

          {/* Skills */}
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            {PROFILE.skills.map((skill) => (
              <Badge key={skill} variant="tool" className="bg-bryant-gold/15 text-bryant-gold">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* ---- STATS ROW ---- */}
      <div className="border-b border-bryant-gray-200 bg-white">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-bryant-gray-200 sm:grid-cols-4">
          {[
            { label: "Projects", value: STATS.projects, icon: <FolderOpen className="h-5 w-5 text-bryant-gold" /> },
            { label: "Peer Reviews", value: STATS.reviews, icon: <MessageSquare className="h-5 w-5 text-purple-500" /> },
            { label: "Challenge Wins", value: STATS.challengeWins, icon: <Trophy className="h-5 w-5 text-amber-500" /> },
            { label: "Certifications", value: STATS.certifications, icon: <Award className="h-5 w-5 text-green-600" /> },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center justify-center gap-3 px-4 py-5">
              {stat.icon}
              <div>
                <p className="text-2xl font-bold text-bryant-gray-900">{stat.value}</p>
                <p className="text-xs text-bryant-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- TABS ---- */}
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Tabs activeTab={activeTab} onTabChange={setActiveTab}>
          <TabList>
            <Tab value="projects">
              <span className="flex items-center gap-1.5">
                <FolderOpen className="h-4 w-4" /> Projects
              </span>
            </Tab>
            <Tab value="reviews">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" /> Reviews
              </span>
            </Tab>
            <Tab value="certifications">
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4" /> Certifications
              </span>
            </Tab>
            <Tab value="activity">
              <span className="flex items-center gap-1.5">
                <Activity className="h-4 w-4" /> Activity
              </span>
            </Tab>
          </TabList>

          {/* ===== PROJECTS TAB ===== */}
          <TabPanel value="projects">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {PROJECTS.map((project) => (
                <Card key={project.id} className="flex flex-col">
                  {/* Sport ribbon */}
                  <div className="flex items-center justify-between px-6 py-3">
                    <Badge variant="sport">{project.sport}</Badge>
                    <span className="text-xs text-bryant-gray-400">{formatDate(project.publishedAt)}</span>
                  </div>
                  <CardContent className="flex flex-1 flex-col pt-0">
                    <h3 className="text-base font-semibold text-bryant-gray-900">{project.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-bryant-gray-600">
                      {truncate(project.description, 140)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {project.tags.map((tag) => (
                        <Badge key={tag} variant="technique" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs text-bryant-gray-500">
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-bryant-gold text-bryant-gold" /> {project.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" /> {project.reviews} reviews
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabPanel>

          {/* ===== REVIEWS TAB ===== */}
          <TabPanel value="reviews">
            <div className="space-y-4">
              {REVIEWS.map((review) => (
                <Card key={review.id}>
                  <CardContent className="space-y-3">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-bryant-gray-900">
                          {review.projectTitle}
                        </h3>
                        <p className="text-xs text-bryant-gray-500">by {review.projectAuthor}</p>
                      </div>
                      <span className="text-xs text-bryant-gray-400">{formatDate(review.createdAt)}</span>
                    </div>

                    {/* Scores */}
                    <div className="flex flex-wrap gap-4">
                      {Object.entries(review.scores).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <span className="text-xs capitalize text-bryant-gray-600">{key}:</span>
                          <ScoreStars score={val} />
                        </div>
                      ))}
                    </div>

                    <p className="text-sm leading-relaxed text-bryant-gray-700">{review.excerpt}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabPanel>

          {/* ===== CERTIFICATIONS TAB ===== */}
          <TabPanel value="certifications">
            <div className="space-y-4">
              {CERTIFICATIONS.map((cert) => (
                <Card key={cert.id}>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      {/* Provider logo placeholder */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-bryant-gray-100 text-bryant-gray-500">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-bryant-gray-900">{cert.name}</h3>
                        <p className="text-xs text-bryant-gray-500">{cert.provider}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-bryant-gray-400">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          Completed {formatDate(cert.completedAt)}
                        </p>
                      </div>
                      <a href={cert.verifyUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          Verify
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabPanel>

          {/* ===== ACTIVITY TAB ===== */}
          <TabPanel value="activity">
            <div className="relative space-y-0">
              {/* Timeline line */}
              <div className="absolute left-[17px] top-2 bottom-2 w-px bg-bryant-gray-200" />

              {ACTIVITY_FEED.map((item, idx) => (
                <div key={item.id} className="relative flex items-start gap-4 py-3">
                  {/* Dot / icon */}
                  <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-bryant-gray-200 bg-white">
                    {ACTIVITY_ICONS[item.type]}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-bryant-gray-800">{item.label}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-bryant-gray-400">
                      <Clock className="h-3 w-3" />
                      {timeAgo(item.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}
