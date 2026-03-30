"use client";

import React, { useState } from "react";
import {
  Star,
  ClipboardCheck,
  Eye,
  Award,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OpenRequest {
  id: string;
  title: string;
  author: string;
  sports: string[];
  requestedDate: string;
  criteria: string[];
}

interface MyReview {
  id: string;
  projectTitle: string;
  author: string;
  scores: { methodology: number; visualization: number; writing: number; overall: number };
  date: string;
}

interface ReceivedReview {
  id: string;
  reviewerName: string;
  projectTitle: string;
  scores: { methodology: number; visualization: number; writing: number; overall: number };
  feedbackExcerpt: string;
  date: string;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const OPEN_REQUESTS: OpenRequest[] = [
  {
    id: "or1",
    title: "NFL Expected Points Model Using nflFastR",
    author: "Marcus Chen",
    sports: ["NFL"],
    requestedDate: "Mar 28, 2026",
    criteria: ["Methodology", "Code Quality", "Visualization"],
  },
  {
    id: "or2",
    title: "Premier League xG Model",
    author: "Sofia Nguyen",
    sports: ["MLS"],
    requestedDate: "Mar 27, 2026",
    criteria: ["Methodology", "Statistical Rigor", "Writing"],
  },
  {
    id: "or3",
    title: "NBA Injury Prediction with Time Series Analysis",
    author: "Priya Patel",
    sports: ["NBA"],
    requestedDate: "Mar 25, 2026",
    criteria: ["Methodology", "Data Cleaning", "Visualization"],
  },
  {
    id: "or4",
    title: "NHL Player Dashboard via Web Scraping",
    author: "Ryan O'Sullivan",
    sports: ["NHL"],
    requestedDate: "Mar 24, 2026",
    criteria: ["Code Quality", "Data Pipeline", "Visualization"],
  },
  {
    id: "or5",
    title: "MLB Dynamic Ticket Pricing Optimization",
    author: "Emma Gonzalez",
    sports: ["MLB"],
    requestedDate: "Mar 22, 2026",
    criteria: ["Methodology", "Business Impact", "Writing"],
  },
];

const MY_REVIEWS: MyReview[] = [
  {
    id: "mr1",
    projectTitle: "NBA Draft Big Board: Statistical Similarity Clustering",
    author: "Alyssa Rivera",
    scores: { methodology: 5, visualization: 4, writing: 5, overall: 5 },
    date: "Mar 26, 2026",
  },
  {
    id: "mr2",
    projectTitle: "March Madness Bracket Optimization",
    author: "David Kim",
    scores: { methodology: 5, visualization: 5, writing: 4, overall: 5 },
    date: "Mar 20, 2026",
  },
  {
    id: "mr3",
    projectTitle: "MLB Pitch Classification with Random Forest",
    author: "Jake Thompson",
    scores: { methodology: 4, visualization: 4, writing: 3, overall: 4 },
    date: "Mar 14, 2026",
  },
  {
    id: "mr4",
    projectTitle: "NFL Combine Performance Clustering",
    author: "Tyler Brooks",
    scores: { methodology: 4, visualization: 5, writing: 4, overall: 4 },
    date: "Mar 8, 2026",
  },
  {
    id: "mr5",
    projectTitle: "NBA Shot Chart Heatmaps",
    author: "Jordan Lee",
    scores: { methodology: 3, visualization: 5, writing: 3, overall: 4 },
    date: "Feb 28, 2026",
  },
];

const RECEIVED_REVIEWS: ReceivedReview[] = [
  {
    id: "rr1",
    reviewerName: "Alyssa Rivera",
    projectTitle: "March Madness Bracket Simulation",
    scores: { methodology: 5, visualization: 4, writing: 4, overall: 4 },
    feedbackExcerpt:
      "Excellent Monte Carlo approach. The convergence diagnostics are well-presented. Consider adding prior sensitivity analysis for upset probabilities.",
    date: "Mar 27, 2026",
  },
  {
    id: "rr2",
    reviewerName: "Dr. Kevin Bahr",
    projectTitle: "March Madness Bracket Simulation",
    scores: { methodology: 5, visualization: 5, writing: 5, overall: 5 },
    feedbackExcerpt:
      "Outstanding work. The Bayesian framework is well-motivated and the simulation methodology is sound. One of the strongest projects this semester.",
    date: "Mar 25, 2026",
  },
  {
    id: "rr3",
    reviewerName: "Marcus Chen",
    projectTitle: "NFL Redzone Efficiency Dashboard",
    scores: { methodology: 4, visualization: 5, writing: 4, overall: 4 },
    feedbackExcerpt:
      "Great Tableau dashboard design. The drill-down from team to player level is intuitive. Methodology section could cite more literature.",
    date: "Mar 18, 2026",
  },
  {
    id: "rr4",
    reviewerName: "Jake Thompson",
    projectTitle: "NFL Redzone Efficiency Dashboard",
    scores: { methodology: 4, visualization: 4, writing: 3, overall: 4 },
    feedbackExcerpt:
      "Solid analysis. The play-type breakdowns are insightful. Writing could be tighter in the results section -- some redundancy with the captions.",
    date: "Mar 12, 2026",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function StarRating({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < score
              ? "fill-bryant-gold text-bryant-gold"
              : "fill-bryant-gray-200 text-bryant-gray-200"
          }`}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ReviewsPage() {
  const [tab, setTab] = useState("open");

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-bryant-gray-900">Peer Reviews</h1>

      {/* Stats Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-bryant-gold/10">
              <ClipboardCheck className="h-5 w-5 text-bryant-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold text-bryant-gray-900">12</p>
              <p className="text-xs text-bryant-gray-500">Reviews Written</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-bryant-gray-900">4.3</p>
              <p className="text-xs text-bryant-gray-500">Avg Rating Given</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <Award className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-bryant-gray-900">Gold</p>
              <p className="text-xs text-bryant-gray-500">Reviewer Level</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs activeTab={tab} onTabChange={setTab}>
        <TabList>
          <Tab value="open">Open Requests</Tab>
          <Tab value="mine">My Reviews</Tab>
          <Tab value="received">Reviews of My Work</Tab>
        </TabList>

        {/* ---- Open Requests ---- */}
        <TabPanel value="open">
          <div className="space-y-4">
            {OPEN_REQUESTS.map((req) => (
              <Card key={req.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <Avatar name={req.author} size="md" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-bryant-gray-900 truncate">
                        {req.title}
                      </p>
                      <p className="text-xs text-bryant-gray-500 mt-0.5">
                        by {req.author} &middot; Review requested {req.requestedDate}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {req.sports.map((s) => (
                          <Badge key={s} variant="sport">
                            {s}
                          </Badge>
                        ))}
                        {req.criteria.map((c) => (
                          <Badge key={c} variant="technique">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button variant="primary" size="sm" className="shrink-0 self-start sm:self-center">
                    Start Review
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabPanel>

        {/* ---- My Reviews ---- */}
        <TabPanel value="mine">
          <div className="space-y-4">
            {MY_REVIEWS.map((rev) => (
              <Card key={rev.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-bryant-gray-900 truncate">
                      {rev.projectTitle}
                    </p>
                    <p className="text-xs text-bryant-gray-500 mt-0.5">
                      by {rev.author} &middot; Reviewed {rev.date}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-bryant-gray-600">
                      <span className="inline-flex items-center gap-1">
                        Methodology <StarRating score={rev.scores.methodology} />
                      </span>
                      <span className="inline-flex items-center gap-1">
                        Visualization <StarRating score={rev.scores.visualization} />
                      </span>
                      <span className="inline-flex items-center gap-1">
                        Writing <StarRating score={rev.scores.writing} />
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold">
                        Overall <StarRating score={rev.scores.overall} />
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0 self-start sm:self-center">
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabPanel>

        {/* ---- Reviews of My Work ---- */}
        <TabPanel value="received">
          <div className="space-y-4">
            {RECEIVED_REVIEWS.map((rev) => (
              <Card key={rev.id} className="hover:shadow-md transition-shadow">
                <CardContent className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={rev.reviewerName} size="md" />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-bryant-gray-900">
                          {rev.reviewerName}
                        </p>
                        <p className="text-xs text-bryant-gray-500">
                          reviewed <span className="font-medium">{rev.projectTitle}</span>{" "}
                          &middot; {rev.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <TrendingUp className="h-4 w-4 text-bryant-gold" />
                      <span className="text-sm font-bold text-bryant-gray-900">
                        {rev.scores.overall}/5
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-bryant-gray-600">
                    <span className="inline-flex items-center gap-1">
                      Methodology <StarRating score={rev.scores.methodology} />
                    </span>
                    <span className="inline-flex items-center gap-1">
                      Visualization <StarRating score={rev.scores.visualization} />
                    </span>
                    <span className="inline-flex items-center gap-1">
                      Writing <StarRating score={rev.scores.writing} />
                    </span>
                  </div>

                  <p className="text-sm text-bryant-gray-700 bg-bryant-gray-50 rounded-lg p-3 italic">
                    &ldquo;{rev.feedbackExcerpt}&rdquo;
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
