"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Eye,
  MessageSquare,
  Star,
  Code,
  BarChart3,
  Video,
  CheckCircle,
  Reply,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, timeAgo, truncate } from "@/lib/utils";

/* ---------- Mock Data ---------- */

const PROJECT = {
  slug: "nfl-expected-points-model-nflfastr",
  title: "NFL Expected Points Model Using nflFastR",
  abstract:
    "A comprehensive expected points added (EPA) model built on play-by-play data from nflFastR. Analyzes offensive efficiency across all 32 teams using logistic regression and gradient boosted trees, with interactive Tableau dashboards for visualization.",
  sports: ["NFL"],
  techniques: ["Regression", "Classification"],
  tools: ["Python", "R", "Tableau"],
  domains: ["In-Game Strategy", "Player Evaluation"],
  author: {
    name: "Marcus Chen",
    classYear: "2027",
    bio: "Junior data science major at Bryant University. Passionate about applying machine learning to football analytics. Current president of the Sports Analytics Club.",
  },
  publishedAt: "2026-03-15",
  views: 342,
  comments: 18,
  reviews: 4,
  rating: 4.7,
  visibility: "Public",
  openForReview: true,
  githubUrl: "https://github.com/mchen/nfl-epa-model",
  tableauUrl: "https://public.tableau.com/views/nfl-epa-dashboard",
  videoUrl: "",
  content: `## Introduction

Expected Points Added (EPA) has become one of the most important metrics in modern football analytics. This project builds a comprehensive EPA model from scratch using play-by-play data from the nflFastR package, covering NFL seasons from 2016 to 2025.

## Data Collection

Play-by-play data was collected using the nflFastR R package, which provides detailed information on every play including down, distance, yard line, score differential, and time remaining. The dataset includes approximately 450,000 plays across 10 seasons.

## Methodology

### Feature Engineering

Key features include:
- Down and distance
- Yard line (distance from end zone)
- Score differential
- Time remaining in half
- Timeouts remaining
- Home/away indicator

### Model Architecture

Two models were built and compared:

1. **Multinomial Logistic Regression** - A baseline model predicting the probability of each next scoring event (touchdown, field goal, safety, no score, or opponent scoring)

2. **Gradient Boosted Trees (XGBoost)** - A more sophisticated model that captures non-linear relationships between game state variables and expected points

The XGBoost model achieved a log-loss of 1.23 on the test set, compared to 1.41 for logistic regression.

## Results

The model produces expected point values for every game state, which can be used to evaluate play-calling decisions, player performance, and team efficiency. Key findings include:

- Fourth-down decision-making has improved league-wide by 15% since 2020
- Play-action passes generate 1.2 more EPA per play than non-play-action
- RPO plays show diminishing returns after the first quarter

## Interactive Dashboard

An interactive Tableau dashboard allows users to explore EPA by team, week, and play type. Users can compare offensive and defensive efficiency across the league.

## Conclusion

This project demonstrates the power of expected points models for evaluating NFL strategy. The XGBoost model provides reliable EPA estimates that align with advanced analytics used by NFL front offices.`,
};

const MOCK_COMMENTS = [
  {
    id: "1",
    author: { name: "Alyssa Rivera" },
    content:
      "Great work on the feature engineering, Marcus! Have you considered adding pre-snap formation data as a feature? That might improve the play-action detection.",
    createdAt: "2026-03-16T14:30:00Z",
  },
  {
    id: "2",
    author: { name: "Jake Thompson" },
    content:
      "The Tableau dashboard is really clean. Would love to see a comparison view where you can select two teams side by side. Also, the XGBoost log-loss improvement over logistic regression is impressive.",
    createdAt: "2026-03-17T09:15:00Z",
  },
  {
    id: "3",
    author: { name: "Dr. Sarah Mitchell" },
    content:
      "Excellent project, Marcus. For your next iteration, I'd recommend looking into calibration plots to ensure the predicted probabilities are well-calibrated. This is especially important for EPA models used in decision-making contexts.",
    createdAt: "2026-03-18T11:00:00Z",
  },
];

const RELATED_PROJECTS = [
  {
    slug: "nfl-combine-performance-clustering",
    title: "NFL Combine Performance Clustering",
    author: { name: "Tyler Brooks" },
    sports: ["NFL"],
    tools: ["Python", "Tableau"],
    gradient: "from-gray-700 to-gray-900",
    views: 415,
  },
  {
    slug: "march-madness-bracket-optimization",
    title: "March Madness Bracket Optimization",
    author: { name: "David Kim" },
    sports: ["College"],
    tools: ["Python", "SQL"],
    gradient: "from-blue-700 to-cyan-900",
    views: 876,
  },
  {
    slug: "nba-draft-big-board-clustering",
    title: "NBA Draft Big Board: Statistical Similarity Clustering",
    author: { name: "Alyssa Rivera" },
    sports: ["NBA"],
    tools: ["Python", "SQL"],
    gradient: "from-orange-600 to-red-800",
    views: 521,
  },
];

/* ---------- Component ---------- */

export default function ProjectDetailPage() {
  const [commentText, setCommentText] = useState("");

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-bryant-gray-500 hover:text-bryant-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-bryant-gray-900">
            {PROJECT.title}
          </h1>
          <Badge variant="success">{PROJECT.visibility}</Badge>
        </div>

        <div className="flex items-center gap-3">
          <Avatar name={PROJECT.author.name} size="md" />
          <div>
            <p className="font-medium text-bryant-gray-900">
              {PROJECT.author.name}
              <span className="ml-1 text-sm font-normal text-bryant-gray-500">
                &apos;{PROJECT.author.classYear}
              </span>
            </p>
            <p className="text-sm text-bryant-gray-500">
              Published {formatDate(PROJECT.publishedAt)}
              <span className="mx-1">&middot;</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {PROJECT.views} views
              </span>
            </p>
          </div>
        </div>

        {/* Badge Rows */}
        <div className="flex flex-wrap gap-2">
          {PROJECT.sports.map((s) => (
            <Badge key={s} variant="sport">{s}</Badge>
          ))}
          {PROJECT.techniques.map((t) => (
            <Badge key={t} variant="technique">{t}</Badge>
          ))}
          {PROJECT.tools.map((t) => (
            <Badge key={t} variant="tool">{t}</Badge>
          ))}
          {PROJECT.domains.map((d) => (
            <Badge key={d} variant="domain">{d}</Badge>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Content Area */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Abstract */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-bryant-gray-900">
                Abstract
              </h2>
            </CardHeader>
            <CardContent>
              <p className="text-bryant-gray-700 leading-relaxed">
                {PROJECT.abstract}
              </p>
            </CardContent>
          </Card>

          {/* Full Content */}
          <Card>
            <CardContent className="prose prose-bryant max-w-none">
              {PROJECT.content.split("\n\n").map((block, i) => {
                if (block.startsWith("## ")) {
                  return (
                    <h2
                      key={i}
                      className="mt-6 mb-3 text-xl font-bold text-bryant-gray-900 first:mt-0"
                    >
                      {block.replace("## ", "")}
                    </h2>
                  );
                }
                if (block.startsWith("### ")) {
                  return (
                    <h3
                      key={i}
                      className="mt-4 mb-2 text-lg font-semibold text-bryant-gray-900"
                    >
                      {block.replace("### ", "")}
                    </h3>
                  );
                }
                if (block.startsWith("1. ") || block.startsWith("- ")) {
                  const items = block.split("\n").filter(Boolean);
                  const isOrdered = block.startsWith("1. ");
                  const Tag = isOrdered ? "ol" : "ul";
                  return (
                    <Tag
                      key={i}
                      className={`my-3 space-y-1 pl-6 text-bryant-gray-700 ${
                        isOrdered ? "list-decimal" : "list-disc"
                      }`}
                    >
                      {items.map((item, j) => (
                        <li key={j}>
                          {item
                            .replace(/^\d+\.\s\*\*(.+?)\*\*/, "$1")
                            .replace(/^- /, "")}
                        </li>
                      ))}
                    </Tag>
                  );
                }
                return (
                  <p key={i} className="my-3 text-bryant-gray-700 leading-relaxed">
                    {block}
                  </p>
                );
              })}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-bryant-gray-900">
                Comments ({MOCK_COMMENTS.length})
              </h2>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comment Input */}
              <div className="flex gap-3">
                <Avatar name="You" size="sm" className="mt-1 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    rows={3}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button variant="primary" size="sm">
                      <Send className="h-3.5 w-3.5" />
                      Comment
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comment List */}
              <div className="space-y-5 border-t border-bryant-gray-200 pt-5">
                {MOCK_COMMENTS.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar
                      name={comment.author.name}
                      size="sm"
                      className="mt-0.5 shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-bryant-gray-900">
                          {comment.author.name}
                        </span>
                        <span className="text-xs text-bryant-gray-400">
                          {timeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-bryant-gray-700 leading-relaxed">
                        {comment.content}
                      </p>
                      <button className="mt-1.5 inline-flex items-center gap-1 text-xs text-bryant-gray-400 hover:text-bryant-gray-600 transition-colors">
                        <Reply className="h-3 w-3" />
                        Reply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="w-full space-y-4 lg:w-80 lg:shrink-0">
          {/* Author Card */}
          <Card>
            <CardContent className="flex flex-col items-center text-center py-5">
              <Avatar name={PROJECT.author.name} size="xl" />
              <h3 className="mt-3 font-semibold text-bryant-gray-900">
                {PROJECT.author.name}
              </h3>
              <p className="text-sm text-bryant-gray-500">
                Class of &apos;{PROJECT.author.classYear}
              </p>
              <p className="mt-2 text-sm text-bryant-gray-600 leading-relaxed">
                {truncate(PROJECT.author.bio, 120)}
              </p>
              <Link href="/portfolio" className="mt-3">
                <Button variant="outline" size="sm">
                  View Portfolio
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Project Stats */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-bryant-gray-900">
                Project Stats
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 text-bryant-gray-600">
                  <Eye className="h-4 w-4" />
                  Views
                </span>
                <span className="font-medium text-bryant-gray-900">
                  {PROJECT.views}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 text-bryant-gray-600">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </span>
                <span className="font-medium text-bryant-gray-900">
                  {PROJECT.comments}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 text-bryant-gray-600">
                  <CheckCircle className="h-4 w-4" />
                  Reviews
                </span>
                <span className="font-medium text-bryant-gray-900">
                  {PROJECT.reviews}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-2 text-bryant-gray-600">
                  <Star className="h-4 w-4" />
                  Rating
                </span>
                <span className="font-medium text-bryant-gold">
                  {PROJECT.rating} / 5.0
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Links */}
          {(PROJECT.githubUrl || PROJECT.tableauUrl || PROJECT.videoUrl) && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-bryant-gray-900">
                  Links
                </h3>
              </CardHeader>
              <CardContent className="space-y-2">
                {PROJECT.githubUrl && (
                  <a
                    href={PROJECT.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-bryant-gray-200 px-3 py-2 text-sm text-bryant-gray-700 hover:bg-bryant-gray-50 transition-colors"
                  >
                    <Code className="h-4 w-4" />
                    GitHub Repository
                  </a>
                )}
                {PROJECT.tableauUrl && (
                  <a
                    href={PROJECT.tableauUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-bryant-gray-200 px-3 py-2 text-sm text-bryant-gray-700 hover:bg-bryant-gray-50 transition-colors"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Tableau Dashboard
                  </a>
                )}
                {PROJECT.videoUrl && (
                  <a
                    href={PROJECT.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-bryant-gray-200 px-3 py-2 text-sm text-bryant-gray-700 hover:bg-bryant-gray-50 transition-colors"
                  >
                    <Video className="h-4 w-4" />
                    Video Presentation
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Open for Review */}
          {PROJECT.openForReview && (
            <Card className="border-bryant-gold/30 bg-bryant-gold/5">
              <CardContent className="flex flex-col items-center py-5 text-center">
                <CheckCircle className="h-8 w-8 text-bryant-gold" />
                <h3 className="mt-2 font-semibold text-bryant-gray-900">
                  Open for Review
                </h3>
                <p className="mt-1 text-sm text-bryant-gray-600">
                  This project is accepting peer reviews
                </p>
                <Button variant="primary" size="sm" className="mt-3">
                  Write Review
                </Button>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      {/* Related Projects */}
      <div className="space-y-4 border-t border-bryant-gray-200 pt-6">
        <h2 className="text-xl font-bold text-bryant-gray-900">
          Related Projects
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {RELATED_PROJECTS.map((project) => (
            <Card key={project.slug} className="hover:shadow-md transition-shadow">
              <div
                className={`h-28 bg-gradient-to-br ${project.gradient} flex items-center justify-center`}
              >
                <span className="text-3xl font-bold text-white/30">
                  {project.sports[0]}
                </span>
              </div>
              <CardContent className="space-y-2">
                <Link
                  href={`/projects/${project.slug}`}
                  className="block text-sm font-semibold text-bryant-gray-900 hover:text-bryant-gold transition-colors line-clamp-2"
                >
                  {project.title}
                </Link>
                <div className="flex items-center justify-between text-xs text-bryant-gray-500">
                  <span>{project.author.name}</span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {project.views}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {project.tools.map((tool) => (
                    <Badge key={tool} variant="tool">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
