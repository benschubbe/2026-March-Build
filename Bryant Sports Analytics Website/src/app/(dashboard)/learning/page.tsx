"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Circle,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LearningStep {
  title: string;
  type: "Tutorial" | "Project" | "External Course" | "Challenge";
  completed: boolean;
}

interface LearningPath {
  slug: string;
  title: string;
  description: string;
  sportFocus: string[];
  roleFocus: string[];
  gradient: string;
  stepCount: number;
  estimatedTime: string;
  progress: number;
  steps: LearningStep[];
}

const TYPE_BADGE_VARIANT: Record<string, "tool" | "technique" | "domain" | "sport"> = {
  Tutorial: "tool",
  Project: "technique",
  "External Course": "domain",
  Challenge: "sport",
};

const MOCK_PATHS: LearningPath[] = [
  {
    slug: "break-into-nfl-analytics",
    title: "Break into NFL Analytics",
    description:
      "Master the fundamentals of NFL data analysis using nflFastR, expected points added (EPA) models, player tracking data, and NFL Combine measurables. Build a portfolio of projects that demonstrate your ability to generate actionable football insights.",
    sportFocus: ["NFL"],
    roleFocus: ["Data Analyst", "R&D"],
    gradient: "from-blue-600 to-blue-900",
    stepCount: 12,
    estimatedTime: "~6 weeks",
    progress: 42,
    steps: [
      { title: "Introduction to nflFastR & Play-by-Play Data", type: "Tutorial", completed: true },
      { title: "Understanding EPA and WPA Metrics", type: "Tutorial", completed: true },
      { title: "Build an NFL Team Efficiency Dashboard", type: "Project", completed: true },
      { title: "NFL Tracking Data Fundamentals (Next Gen Stats)", type: "External Course", completed: false },
      { title: "Combine Measurables Analysis Challenge", type: "Challenge", completed: false },
    ],
  },
  {
    slug: "nba-draft-modeling",
    title: "NBA Draft Modeling",
    description:
      "Learn to project NBA draft prospects using statistical similarity models, clustering algorithms, and advanced visualization techniques. Compare college stats, physical profiles, and play styles to historical NBA players for accurate draft projections.",
    sportFocus: ["NBA"],
    roleFocus: ["Draft Analyst", "Data Scientist"],
    gradient: "from-orange-500 to-orange-800",
    stepCount: 10,
    estimatedTime: "~5 weeks",
    progress: 20,
    steps: [
      { title: "Collecting & Cleaning College Basketball Data", type: "Tutorial", completed: true },
      { title: "Feature Engineering for Player Comparison", type: "Tutorial", completed: true },
      { title: "K-Means Clustering for Player Archetypes", type: "Project", completed: false },
      { title: "Statistical Similarity & Nearest-Neighbor Models", type: "Tutorial", completed: false },
      { title: "Build a Draft Big Board Visualization", type: "Project", completed: false },
    ],
  },
  {
    slug: "sports-betting-expected-value",
    title: "Sports Betting & Expected Value",
    description:
      "Understand the mathematics behind sports betting markets, including probability theory, line movement analysis, bankroll management, and market efficiency. Learn to identify value and build models that quantify edge.",
    sportFocus: ["Multi-Sport"],
    roleFocus: ["Quantitative Analyst", "Trader"],
    gradient: "from-green-600 to-green-900",
    stepCount: 8,
    estimatedTime: "~4 weeks",
    progress: 0,
    steps: [
      { title: "Probability Fundamentals for Sports Betting", type: "Tutorial", completed: false },
      { title: "Understanding Odds Formats & Implied Probability", type: "Tutorial", completed: false },
      { title: "Line Movement & Market Efficiency", type: "External Course", completed: false },
      { title: "Bankroll Management & Kelly Criterion", type: "Tutorial", completed: false },
      { title: "Build an Expected Value Calculator", type: "Project", completed: false },
    ],
  },
  {
    slug: "broadcast-media-analytics",
    title: "Broadcast & Media Analytics",
    description:
      "Develop skills in data storytelling, visualization best practices, and audience engagement metrics for sports media. Learn to translate complex analytics into compelling narratives that resonate with fans and broadcast audiences.",
    sportFocus: ["Multi-Sport"],
    roleFocus: ["Media Analyst", "Content Strategist"],
    gradient: "from-purple-600 to-purple-900",
    stepCount: 9,
    estimatedTime: "~4.5 weeks",
    progress: 67,
    steps: [
      { title: "Principles of Data Storytelling in Sports", type: "Tutorial", completed: true },
      { title: "Visualization Best Practices for Broadcast", type: "Tutorial", completed: true },
      { title: "Creating Engaging Infographics", type: "Project", completed: true },
      { title: "Audience Engagement & Social Media Metrics", type: "External Course", completed: false },
      { title: "Build a Live Game Data Overlay Prototype", type: "Challenge", completed: false },
    ],
  },
  {
    slug: "baseball-research-development",
    title: "Baseball R&D",
    description:
      "Dive deep into modern baseball analytics with Statcast data, pitch modeling, batted ball analysis, and player tracking systems like TrackMan and Hawk-Eye. Build the analytical foundation used by MLB front offices and R&D departments.",
    sportFocus: ["MLB"],
    roleFocus: ["R&D Analyst", "Data Scientist"],
    gradient: "from-red-600 to-red-900",
    stepCount: 14,
    estimatedTime: "~7 weeks",
    progress: 7,
    steps: [
      { title: "Getting Started with Statcast & pybaseball", type: "Tutorial", completed: true },
      { title: "Pitch Classification & Movement Profiles", type: "Tutorial", completed: false },
      { title: "Batted Ball Analysis: Launch Angle & Exit Velocity", type: "Project", completed: false },
      { title: "TrackMan & Hawk-Eye Data Overview", type: "External Course", completed: false },
      { title: "Build a Pitcher Arsenal Visualization", type: "Project", completed: false },
    ],
  },
  {
    slug: "sports-data-engineering",
    title: "Sports Data Engineering",
    description:
      "Build the infrastructure that powers sports analytics. Learn SQL optimization, ETL pipeline design, cloud data warehousing, API development, and real-time data processing to support analytics teams at scale.",
    sportFocus: ["Multi-Sport"],
    roleFocus: ["Data Engineer", "Backend Developer"],
    gradient: "from-teal-600 to-teal-900",
    stepCount: 11,
    estimatedTime: "~5.5 weeks",
    progress: 36,
    steps: [
      { title: "Advanced SQL for Sports Databases", type: "Tutorial", completed: true },
      { title: "Designing ETL Pipelines with Python & Airflow", type: "Tutorial", completed: true },
      { title: "Cloud Data Warehousing (BigQuery / Snowflake)", type: "External Course", completed: false },
      { title: "Building RESTful APIs for Sports Data", type: "Project", completed: false },
      { title: "Real-Time Data Streaming Challenge", type: "Challenge", completed: false },
    ],
  },
];

export default function LearningPathsPage() {
  const [expandedPath, setExpandedPath] = useState<string | null>(null);

  const toggleExpand = (slug: string) => {
    setExpandedPath((prev) => (prev === slug ? null : slug));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bryant-gray-900">
            Learning Paths
          </h1>
          <p className="mt-1 text-sm text-bryant-gray-500">
            Curated roadmaps to help you break into sports analytics
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-bryant-gray-500">
          <GraduationCap className="h-5 w-5 text-bryant-gold" />
          <span className="font-medium text-bryant-gray-700">3 paths in progress</span>
        </div>
      </div>

      {/* Path Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {MOCK_PATHS.map((path) => {
          const isExpanded = expandedPath === path.slug;
          const completedSteps = Math.round((path.progress / 100) * path.stepCount);

          return (
            <Card key={path.slug} className="flex flex-col hover:shadow-md transition-shadow">
              {/* Gradient Header */}
              <div
                className={`relative h-3 bg-gradient-to-r ${path.gradient}`}
              />

              <CardContent className="flex-1 space-y-4">
                {/* Title & Badges */}
                <div>
                  <Link
                    href={`/learning/${path.slug}`}
                    className="text-lg font-semibold text-bryant-gray-900 hover:text-bryant-gold transition-colors"
                  >
                    {path.title}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {path.sportFocus.map((s) => (
                      <Badge key={s} variant="sport">
                        {s}
                      </Badge>
                    ))}
                    {path.roleFocus.map((r) => (
                      <Badge key={r} variant="domain">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-bryant-gray-600 leading-relaxed">
                  {path.description}
                </p>

                {/* Meta Row */}
                <div className="flex items-center gap-4 text-sm text-bryant-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {path.stepCount} steps
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {path.estimatedTime}
                  </span>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-bryant-gray-500 mb-1">
                    <span>{completedSteps} of {path.stepCount} steps complete</span>
                    <span className="font-medium">{path.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-bryant-gray-100">
                    <div
                      className="h-2 rounded-full bg-bryant-gold transition-all"
                      style={{ width: `${path.progress}%` }}
                    />
                  </div>
                </div>

                {/* Expandable Steps */}
                <button
                  onClick={() => toggleExpand(path.slug)}
                  className="flex items-center gap-1 text-sm font-medium text-bryant-gold hover:text-bryant-gold-light transition-colors"
                >
                  {isExpanded ? (
                    <>
                      Hide steps <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Preview steps <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>

                {isExpanded && (
                  <div className="space-y-2 border-t border-bryant-gray-100 pt-3">
                    {path.steps.map((step, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm"
                      >
                        {step.completed ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                        ) : (
                          <Circle className="mt-0.5 h-4 w-4 shrink-0 text-bryant-gray-300" />
                        )}
                        <span
                          className={
                            step.completed
                              ? "text-bryant-gray-500 line-through"
                              : "text-bryant-gray-700"
                          }
                        >
                          {step.title}
                        </span>
                        <Badge
                          variant={TYPE_BADGE_VARIANT[step.type] || "default"}
                          className="ml-auto shrink-0"
                        >
                          {step.type}
                        </Badge>
                      </div>
                    ))}
                    {path.stepCount > 5 && (
                      <p className="text-xs text-bryant-gray-400 pl-6">
                        +{path.stepCount - 5} more steps...
                      </p>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <Link href={`/learning/${path.slug}`}>
                  <Button
                    variant={path.progress > 0 ? "primary" : "outline"}
                    className="w-full"
                  >
                    {path.progress > 0 ? (
                      <>
                        Continue Path <ArrowRight className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Start Path <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
