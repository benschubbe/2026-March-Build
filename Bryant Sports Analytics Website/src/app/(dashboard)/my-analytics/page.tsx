"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Eye,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Flame,
  Lightbulb,
  Heart,
  Zap,
  FolderOpen,
  Award,
  Trophy,
  Star,
  FileText,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────────────── */

interface AnalyticsData {
  user: { name: string; role: string; createdAt: string } | null;
  overview: {
    totalPosts: number;
    totalReactions: number;
    totalComments: number;
    totalProjectViews: number;
    totalProjectComments: number;
    totalProjects: number;
    estimatedImpressions: number;
    reviewsGiven: number;
    reviewsReceived: number;
    certifications: number;
    challengeSubmissions: number;
    challengeWins: number;
    challengeVotes: number;
  };
  reactions: Record<string, number>;
  avgScores: {
    methodology: number;
    visualization: number;
    writing: number;
    codeQuality: number;
    rigor: number;
  } | null;
  topPosts: {
    id: string;
    content: string;
    reactions: number;
    comments: number;
    engagement: number;
    channel: string | null;
    createdAt: string;
  }[];
  postsPerMonth: { month: string; posts: number; reactions: number }[];
  topProjects: {
    slug: string;
    title: string;
    views: number;
    comments: number;
    reviewCount: number;
  }[];
}

/* ─── Mock data (used when API is unavailable) ──────────────────────── */

const MOCK_DATA: AnalyticsData = {
  user: { name: "Ben Schubbe", role: "STUDENT", createdAt: "2025-09-01T00:00:00" },
  overview: {
    totalPosts: 34,
    totalReactions: 187,
    totalComments: 96,
    totalProjectViews: 1739,
    totalProjectComments: 83,
    totalProjects: 6,
    estimatedImpressions: 4280,
    reviewsGiven: 14,
    reviewsReceived: 9,
    certifications: 3,
    challengeSubmissions: 5,
    challengeWins: 2,
    challengeVotes: 31,
  },
  reactions: { UPVOTE: 78, INSIGHTFUL: 52, FIRE: 34, CLAP: 23 },
  avgScores: {
    methodology: 4.2,
    visualization: 3.8,
    writing: 4.0,
    codeQuality: 4.5,
    rigor: 3.9,
  },
  topPosts: [
    {
      id: "p1",
      content: "Just discovered a fascinating correlation between QB release time and EPA in the 2025 season — thread incoming...",
      reactions: 42,
      comments: 18,
      engagement: 60,
      channel: "NFL Analytics",
      createdAt: "2026-03-28T14:30:00",
    },
    {
      id: "p2",
      content: "My take: Expected Points Added is the single most underutilized stat in college basketball analytics right now.",
      reactions: 38,
      comments: 15,
      engagement: 53,
      channel: null,
      createdAt: "2026-03-22T09:15:00",
    },
    {
      id: "p3",
      content: "Finished my March Madness bracket model — backtested over 10 years of tournament data with a 68% accuracy on upsets.",
      reactions: 31,
      comments: 12,
      engagement: 43,
      channel: "NCAA Basketball",
      createdAt: "2026-03-15T16:00:00",
    },
    {
      id: "p4",
      content: "Hot take: WAR for pitchers needs a complete overhaul. Here's why FIP-based models miss the mark on modern pitching...",
      reactions: 28,
      comments: 20,
      engagement: 48,
      channel: "MLB Analytics",
      createdAt: "2026-03-10T11:00:00",
    },
    {
      id: "p5",
      content: "Just wrapped a web scraping tutorial on pulling PBP data from the NBA API — link in the comments for anyone interested.",
      reactions: 24,
      comments: 9,
      engagement: 33,
      channel: null,
      createdAt: "2026-02-28T10:45:00",
    },
  ],
  postsPerMonth: [
    { month: "Nov '25", posts: 3, reactions: 14 },
    { month: "Dec '25", posts: 5, reactions: 22 },
    { month: "Jan '26", posts: 7, reactions: 38 },
    { month: "Feb '26", posts: 8, reactions: 45 },
    { month: "Mar '26", posts: 9, reactions: 56 },
    { month: "Apr '26", posts: 2, reactions: 12 },
  ],
  topProjects: [
    { slug: "march-madness-bracket-optimization", title: "March Madness Bracket Optimization", views: 876, comments: 41, reviewCount: 3 },
    { slug: "nba-draft-clustering", title: "NBA Draft Big Board Clustering", views: 521, comments: 24, reviewCount: 2 },
    { slug: "nfl-expected-points-model", title: "NFL Expected Points Model", views: 342, comments: 18, reviewCount: 4 },
  ],
};

/* ─── Helpers ───────────────────────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  sub,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bryant-gray-100 text-bryant-gray-500">
            {icon}
          </div>
          {trend !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                trend >= 0
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {trend >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trend >= 0 ? "+" : ""}
              {trend}%
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-bryant-gray-900">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-sm text-bryant-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-bryant-gray-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function BarChartSimple({
  data,
}: {
  data: { month: string; posts: number; reactions: number }[];
}) {
  const maxVal = Math.max(...data.map((d) => d.reactions), 1);
  const maxPosts = Math.max(...data.map((d) => d.posts), 1);

  return (
    <div className="flex items-end gap-3 h-40">
      {data.map((d) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col items-center gap-0.5" style={{ height: "120px" }}>
            {/* Reactions bar */}
            <div className="w-full flex items-end justify-center" style={{ height: "120px" }}>
              <div className="flex gap-0.5 items-end w-full justify-center">
                <div
                  className="w-3 rounded-t bg-bryant-gold transition-all"
                  style={{ height: `${(d.reactions / maxVal) * 100}px` }}
                  title={`${d.reactions} reactions`}
                />
                <div
                  className="w-3 rounded-t bg-bryant-gray-300 transition-all"
                  style={{ height: `${(d.posts / maxPosts) * 100}px` }}
                  title={`${d.posts} posts`}
                />
              </div>
            </div>
          </div>
          <span className="text-[10px] text-bryant-gray-500 whitespace-nowrap">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

function ScoreBar({ label, score, max = 5 }: { label: string; score: number; max?: number }) {
  const pct = (score / max) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-bryant-gray-700">{label}</span>
        <span className="text-sm font-semibold text-bryant-gray-900">
          {score.toFixed(1)}/{max}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-bryant-gray-200">
        <div
          className="h-2 rounded-full bg-bryant-gold transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const REACTION_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  UPVOTE: { icon: <ThumbsUp className="h-4 w-4" />, label: "Upvotes", color: "text-blue-500" },
  INSIGHTFUL: { icon: <Lightbulb className="h-4 w-4" />, label: "Insightful", color: "text-amber-500" },
  FIRE: { icon: <Flame className="h-4 w-4" />, label: "Fire", color: "text-orange-500" },
  CLAP: { icon: <Heart className="h-4 w-4" />, label: "Claps", color: "text-pink-500" },
};

/* ─── Page ──────────────────────────────────────────────────────────── */

export default function MyAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/me/analytics")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setData(MOCK_DATA))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-bryant-gold" />
      </div>
    );
  }

  if (!data) return null;

  const { overview, reactions, avgScores, topPosts, postsPerMonth, topProjects } = data;

  const engagementRate =
    overview.totalPosts > 0
      ? (
          ((overview.totalReactions + overview.totalComments) /
            overview.estimatedImpressions) *
          100
        ).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-bryant-gray-900">My Analytics</h1>
        <p className="text-sm text-bryant-gray-500">
          Track your content performance, engagement, and growth across the platform.
        </p>
      </div>

      {/* ── Top-level KPIs ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Eye className="h-5 w-5" />}
          label="Est. Impressions"
          value={overview.estimatedImpressions}
          sub="Across all posts"
          trend={18}
        />
        <StatCard
          icon={<ThumbsUp className="h-5 w-5" />}
          label="Total Reactions"
          value={overview.totalReactions}
          sub={`${engagementRate}% engagement rate`}
          trend={12}
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5" />}
          label="Comments Received"
          value={overview.totalComments}
          sub="On your posts"
          trend={8}
        />
        <StatCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Total Posts"
          value={overview.totalPosts}
          sub={`${overview.totalProjects} projects published`}
        />
      </div>

      {/* ── Second row: project & career metrics ────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FolderOpen className="h-5 w-5" />}
          label="Project Views"
          value={overview.totalProjectViews}
          sub={`${overview.totalProjectComments} project comments`}
          trend={22}
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Peer Reviews"
          value={`${overview.reviewsReceived} received`}
          sub={`${overview.reviewsGiven} given`}
        />
        <StatCard
          icon={<Award className="h-5 w-5" />}
          label="Certifications"
          value={overview.certifications}
        />
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label="Challenges"
          value={`${overview.challengeWins} wins`}
          sub={`${overview.challengeSubmissions} submissions · ${overview.challengeVotes} votes`}
        />
      </div>

      {/* ── Main content grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Over Time — spans 2 cols */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-bryant-gray-900">
                Activity Over Time
              </h2>
              <div className="flex items-center gap-4 text-xs text-bryant-gray-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-bryant-gold" />
                  Reactions
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-bryant-gray-300" />
                  Posts
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BarChartSimple data={postsPerMonth} />
          </CardContent>
        </Card>

        {/* Reaction Breakdown */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-bryant-gray-900">
              Reaction Breakdown
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(REACTION_META).map(([key, meta]) => {
              const count = reactions[key] || 0;
              const pct =
                overview.totalReactions > 0
                  ? ((count / overview.totalReactions) * 100).toFixed(0)
                  : "0";
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className={`shrink-0 ${meta.color}`}>{meta.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-bryant-gray-700">
                        {meta.label}
                      </span>
                      <span className="text-sm text-bryant-gray-500">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-bryant-gray-200">
                      <div
                        className="h-1.5 rounded-full bg-bryant-gold transition-all"
                        style={{
                          width: `${
                            overview.totalReactions > 0
                              ? (count / overview.totalReactions) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* ── Top Posts & Top Projects side by side ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Posts */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-bryant-gray-900">
              Top Performing Posts
            </h2>
          </CardHeader>
          <CardContent className="space-y-0">
            {topPosts.map((post, i) => (
              <div
                key={post.id}
                className={`py-3 ${
                  i < topPosts.length - 1 ? "border-b border-bryant-gray-100" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-bryant-gold/10 text-xs font-bold text-bryant-gold">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-bryant-gray-800 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-bryant-gray-500">
                      {post.channel && (
                        <Badge variant="default">{post.channel}</Badge>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {post.reactions}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {post.comments}
                      </span>
                      <span>{timeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {topPosts.length === 0 && (
              <p className="py-6 text-center text-sm text-bryant-gray-400">
                No posts yet — start sharing to see analytics here.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-bryant-gray-900">
                Top Projects
              </h2>
              <Link
                href="/projects"
                className="text-sm text-bryant-gold hover:underline"
              >
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            {topProjects.map((project, i) => (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className={`flex items-center gap-3 py-3 hover:bg-bryant-gray-50 -mx-6 px-6 transition-colors ${
                  i < topProjects.length - 1
                    ? "border-b border-bryant-gray-100"
                    : ""
                }`}
              >
                <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-bryant-gold/10 text-xs font-bold text-bryant-gold">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-bryant-gray-800 truncate">
                    {project.title}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-bryant-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {project.views.toLocaleString()} views
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {project.comments}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {project.reviewCount} reviews
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-bryant-gray-400" />
              </Link>
            ))}
            {topProjects.length === 0 && (
              <p className="py-6 text-center text-sm text-bryant-gray-400">
                No projects yet — publish one to track its performance.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Peer Review Scores ──────────────────────────────────────── */}
      {avgScores && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-bryant-gray-900">
              Average Peer Review Scores
            </h2>
            <p className="text-xs text-bryant-gray-500">
              Based on {overview.reviewsReceived} peer review
              {overview.reviewsReceived !== 1 ? "s" : ""} received on your
              projects
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <ScoreBar label="Methodology" score={avgScores.methodology} />
              <ScoreBar label="Visualization" score={avgScores.visualization} />
              <ScoreBar label="Writing" score={avgScores.writing} />
              <ScoreBar label="Code Quality" score={avgScores.codeQuality} />
              <ScoreBar label="Rigor" score={avgScores.rigor} />
              <div className="flex items-center gap-3 sm:pt-3">
                <Zap className="h-5 w-5 text-bryant-gold" />
                <div>
                  <p className="text-sm font-semibold text-bryant-gray-900">
                    {(
                      (avgScores.methodology +
                        avgScores.visualization +
                        avgScores.writing +
                        avgScores.codeQuality +
                        avgScores.rigor) /
                      5
                    ).toFixed(1)}{" "}
                    / 5
                  </p>
                  <p className="text-xs text-bryant-gray-500">Overall Average</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Account Info ────────────────────────────────────────────── */}
      {data.user && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-bryant-gray-900">
              Account Summary
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-bryant-gray-500">Name</p>
                <p className="font-medium text-bryant-gray-900">{data.user.name}</p>
              </div>
              <div>
                <p className="text-bryant-gray-500">Role</p>
                <Badge variant="default">{data.user.role}</Badge>
              </div>
              <div>
                <p className="text-bryant-gray-500">Member Since</p>
                <p className="font-medium text-bryant-gray-900">
                  {new Date(data.user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-bryant-gray-500">Content Score</p>
                <p className="font-medium text-bryant-gold">
                  {Math.round(
                    overview.totalReactions * 2 +
                      overview.totalComments * 3 +
                      overview.totalProjectViews * 0.1 +
                      overview.challengeWins * 50
                  ).toLocaleString()}{" "}
                  pts
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
