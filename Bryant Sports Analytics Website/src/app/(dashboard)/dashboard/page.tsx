"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Eye,
  FolderOpen,
  MessageSquare,
  Target,
  TrendingUp,
  Rocket,
  FileText,
  Award,
  CheckCircle2,
  Briefcase,
  Trophy,
  User,
  ScrollText,
  ThumbsUp,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate, timeAgo } from "@/lib/utils";

interface Activity {
  id: string;
  type: "project" | "review" | "challenge" | "mentorship" | "certification";
  description: string;
  timestamp: string;
}

interface MiniProject {
  slug: string;
  title: string;
  views: number;
  comments: number;
}

interface FeedPost {
  id: string;
  author: string;
  excerpt: string;
  reactions: number;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
}

const ACTIVITIES: Activity[] = [
  {
    id: "a1",
    type: "project",
    description: "Published \"March Madness Bracket Optimization\"",
    timestamp: "2026-03-28T14:30:00",
  },
  {
    id: "a2",
    type: "review",
    description: "Received peer review on \"NFL Expected Points Model\"",
    timestamp: "2026-03-27T09:15:00",
  },
  {
    id: "a3",
    type: "challenge",
    description: "Completed the Weekly SQL Challenge",
    timestamp: "2026-03-25T16:00:00",
  },
  {
    id: "a4",
    type: "mentorship",
    description: "Scheduled check-in with Marcus Williams",
    timestamp: "2026-03-23T11:00:00",
  },
  {
    id: "a5",
    type: "certification",
    description: "Started Google Analytics certification path",
    timestamp: "2026-03-20T10:45:00",
  },
];

const MY_PROJECTS: MiniProject[] = [
  { slug: "march-madness-bracket-optimization", title: "March Madness Bracket Optimization", views: 876, comments: 41 },
  { slug: "nfl-expected-points-model", title: "NFL Expected Points Model", views: 342, comments: 18 },
  { slug: "nba-draft-clustering", title: "NBA Draft Big Board Clustering", views: 521, comments: 24 },
];

const TRENDING_POSTS: FeedPost[] = [
  {
    id: "p1",
    author: "Marcus Chen",
    excerpt: "Just discovered a fascinating correlation between QB release time and EPA in the 2025 season...",
    reactions: 42,
  },
  {
    id: "p2",
    author: "Alyssa Rivera",
    excerpt: "My take on why xG models underperform in MLS vs European leagues: it comes down to data granularity...",
    reactions: 38,
  },
  {
    id: "p3",
    author: "Jake Thompson",
    excerpt: "Hot take: Pitch framing WAR is the most overrated metric in modern baseball analytics. Here's why...",
    reactions: 55,
  },
];

const UPCOMING_EVENTS: UpcomingEvent[] = [
  { id: "e1", title: "Sports Analytics Club Meeting", date: "2026-04-03" },
  { id: "e2", title: "Guest Speaker: Sarah Chen", date: "2026-04-05" },
  { id: "e3", title: "Python Workshop: Web Scraping", date: "2026-04-08" },
];

const SUGGESTED_ACTIONS = [
  { icon: <BarChart3 className="h-4 w-4" />, text: "Your portfolio is missing a SQL project" },
  { icon: <Briefcase className="h-4 w-4" />, text: "3 new NBA analyst roles match your profile" },
  { icon: <Trophy className="h-4 w-4" />, text: "Weekly challenge ends in 2 days" },
  { icon: <User className="h-4 w-4" />, text: "Sarah Chen is available for mentorship" },
  { icon: <ScrollText className="h-4 w-4" />, text: "Complete your Google Analytics certification" },
];

const READINESS_CATEGORIES = [
  { label: "Portfolio", score: 85 },
  { label: "Skills", score: 70 },
  { label: "Network", score: 65 },
  { label: "Interview Prep", score: 60 },
];

const activityIcons: Record<string, React.ReactNode> = {
  project: <Rocket className="h-4 w-4 text-blue-500" />,
  review: <MessageSquare className="h-4 w-4 text-green-500" />,
  challenge: <Award className="h-4 w-4 text-amber-500" />,
  mentorship: <User className="h-4 w-4 text-purple-500" />,
  certification: <FileText className="h-4 w-4 text-bryant-gold" />,
};

export default function DashboardPage() {
  const [readinessExpanded, setReadinessExpanded] = useState(false);

  const today = formatDate(new Date());

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-bryant-gray-900">Welcome back, Ben!</h1>
        <p className="text-sm text-bryant-gray-500">{today}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Eye className="h-5 w-5 text-bryant-gray-400" />
            </div>
            <p className="text-2xl font-bold text-bryant-gray-900">128</p>
            <p className="text-sm text-bryant-gray-500">Profile Views</p>
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-green-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              +12%
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <FolderOpen className="h-5 w-5 text-bryant-gray-400" />
            </div>
            <p className="text-2xl font-bold text-bryant-gray-900">6</p>
            <p className="text-sm text-bryant-gray-500">Projects Published</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <MessageSquare className="h-5 w-5 text-bryant-gray-400" />
            </div>
            <p className="text-2xl font-bold text-bryant-gray-900">14</p>
            <p className="text-sm text-bryant-gray-500">Reviews Written</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-bryant-gray-400" />
            </div>
            {/* Circular Progress */}
            <div className="relative inline-flex items-center justify-center mb-1">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-bryant-gray-200"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={`${(78 / 100) * 150.8} 150.8`}
                  strokeLinecap="round"
                  className="text-bryant-gold"
                />
              </svg>
              <span className="absolute text-sm font-bold text-bryant-gray-900">78</span>
            </div>
            <p className="text-sm text-bryant-gray-500">Career Readiness</p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-bryant-gray-900">Recent Activity</h2>
            </CardHeader>
            <CardContent className="space-y-0">
              {ACTIVITIES.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-3 py-3 ${
                    index < ACTIVITIES.length - 1 ? "border-b border-bryant-gray-100" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{activityIcons[activity.type]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-bryant-gray-800">{activity.description}</p>
                    <p className="text-xs text-bryant-gray-400 mt-0.5">{timeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Your Projects */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-bryant-gray-900">Your Projects</h2>
              <Link href="/projects" className="text-sm text-bryant-gold hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent className="space-y-0">
              {MY_PROJECTS.map((project, index) => (
                <Link
                  key={project.slug}
                  href={`/projects/${project.slug}`}
                  className={`flex items-center justify-between py-3 hover:bg-bryant-gray-50 -mx-6 px-6 transition-colors ${
                    index < MY_PROJECTS.length - 1 ? "border-b border-bryant-gray-100" : ""
                  }`}
                >
                  <span className="text-sm font-medium text-bryant-gray-800 truncate pr-4">
                    {project.title}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-bryant-gray-500 shrink-0">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {project.views}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {project.comments}
                    </span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Suggested Actions */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-bryant-gray-900">Suggested Actions</h2>
            </CardHeader>
            <CardContent className="space-y-0">
              {SUGGESTED_ACTIONS.map((action, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 py-3 ${
                    index < SUGGESTED_ACTIONS.length - 1 ? "border-b border-bryant-gray-100" : ""
                  }`}
                >
                  <div className="shrink-0 text-bryant-gold">{action.icon}</div>
                  <p className="text-sm text-bryant-gray-700 flex-1">{action.text}</p>
                  <CheckCircle2 className="h-4 w-4 text-bryant-gray-300 shrink-0 cursor-pointer hover:text-green-500 transition-colors" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Trending on Feed */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-bryant-gray-900">Trending on Feed</h2>
            </CardHeader>
            <CardContent className="space-y-0">
              {TRENDING_POSTS.map((post, index) => (
                <div
                  key={post.id}
                  className={`py-3 ${
                    index < TRENDING_POSTS.length - 1 ? "border-b border-bryant-gray-100" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar name={post.author} size="sm" />
                    <span className="text-sm font-medium text-bryant-gray-800">{post.author}</span>
                  </div>
                  <p className="text-sm text-bryant-gray-600 line-clamp-2">{post.excerpt}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-bryant-gray-400 mt-1">
                    <ThumbsUp className="h-3 w-3" />
                    {post.reactions} reactions
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-bryant-gray-900">Upcoming Events</h2>
            </CardHeader>
            <CardContent className="space-y-0">
              {UPCOMING_EVENTS.map((event, index) => (
                <Link
                  key={event.id}
                  href="/events"
                  className={`flex items-center gap-3 py-3 hover:bg-bryant-gray-50 -mx-6 px-6 transition-colors ${
                    index < UPCOMING_EVENTS.length - 1 ? "border-b border-bryant-gray-100" : ""
                  }`}
                >
                  <CalendarDays className="h-4 w-4 text-bryant-gold shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-bryant-gray-800 truncate">{event.title}</p>
                    <p className="text-xs text-bryant-gray-500">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Career Readiness Breakdown */}
      <Card>
        <CardHeader>
          <button
            onClick={() => setReadinessExpanded(!readinessExpanded)}
            className="flex items-center justify-between w-full"
          >
            <h2 className="text-lg font-semibold text-bryant-gray-900">Career Readiness Breakdown</h2>
            {readinessExpanded ? (
              <ChevronUp className="h-5 w-5 text-bryant-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-bryant-gray-400" />
            )}
          </button>
        </CardHeader>
        {readinessExpanded && (
          <CardContent className="space-y-4">
            {READINESS_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-bryant-gray-700">{cat.label}</span>
                  <span className="text-sm font-bold text-bryant-gray-900">{cat.score}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-bryant-gray-200">
                  <div
                    className="h-2.5 rounded-full bg-bryant-gold transition-all"
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
