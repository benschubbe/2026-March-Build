"use client";

import React, { useState } from "react";
import {
  Image,
  Link2,
  Code,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Reaction {
  emoji: string;
  label: string;
  count: number;
}

interface Comment {
  id: string;
  author: { name: string; role?: string };
  content: string;
  timeAgo: string;
}

interface Post {
  id: string;
  author: { name: string; role?: string; roleBadgeVariant?: "default" | "sport" | "technique" | "tool" | "domain" };
  timeAgo: string;
  category: string;
  content: string;
  link?: { url: string; label: string };
  hasImage?: boolean;
  reactions: Reaction[];
  commentCount: number;
  comments: Comment[];
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_POSTS: Post[] = [
  {
    id: "1",
    author: { name: "Dr. Kevin Bahr", role: "Faculty", roleBadgeVariant: "domain" },
    timeAgo: "2 hours ago",
    category: "articles",
    content:
      "Great read on how MLB teams are using Statcast spin-rate data to reshape pitching development. The section on induced vertical break vs. actual performance is really eye-opening. Highly recommend for anyone in ISA 340 this semester.",
    link: { url: "#", label: "baseballsavant.mlb.com/article/spin-rate-revolution" },
    reactions: [
      { emoji: "\uD83D\uDC4D", label: "Upvote", count: 24 },
      { emoji: "\uD83D\uDCA1", label: "Insightful", count: 18 },
      { emoji: "\uD83D\uDD25", label: "Fire", count: 7 },
      { emoji: "\uD83D\uDC4F", label: "Clap", count: 5 },
    ],
    commentCount: 6,
    comments: [
      {
        id: "c1",
        author: { name: "Marcus Chen" },
        content: "This lines up perfectly with my EPA model project. The pitch-level data quality from Statcast is incredible.",
        timeAgo: "1 hour ago",
      },
      {
        id: "c2",
        author: { name: "Alyssa Rivera" },
        content: "We discussed this in Sports Analytics Club last week! Would love to do a group analysis on spin rate vs. whiff rate.",
        timeAgo: "45 minutes ago",
      },
    ],
  },
  {
    id: "2",
    author: { name: "Jake Thompson", role: "Student", roleBadgeVariant: "default" },
    timeAgo: "4 hours ago",
    category: "questions",
    content:
      "Hey everyone -- what Python libraries do you recommend for pulling and cleaning sports data? I've been using pandas and nfl_data_py but wondering if there's something better for NBA stats. Any suggestions for real-time data pipelines?",
    reactions: [
      { emoji: "\uD83D\uDC4D", label: "Upvote", count: 11 },
      { emoji: "\uD83D\uDCA1", label: "Insightful", count: 3 },
      { emoji: "\uD83D\uDD25", label: "Fire", count: 1 },
      { emoji: "\uD83D\uDC4F", label: "Clap", count: 0 },
    ],
    commentCount: 8,
    comments: [
      {
        id: "c3",
        author: { name: "Priya Patel" },
        content: "Check out nba_api -- it wraps the official NBA stats endpoints. Also sportsreference for historical data.",
        timeAgo: "3 hours ago",
      },
      {
        id: "c4",
        author: { name: "David Kim" },
        content: "For real-time stuff I've had good luck with sportradar's API. Not free but Bryant has an academic license.",
        timeAgo: "2 hours ago",
      },
      {
        id: "c5",
        author: { name: "Sofia Nguyen" },
        content: "basketball_reference_web_scraper is another solid option for quick pulls.",
        timeAgo: "1 hour ago",
      },
    ],
  },
  {
    id: "3",
    author: { name: "Sarah Mitchell", role: "Alumni - Boston Celtics", roleBadgeVariant: "sport" },
    timeAgo: "6 hours ago",
    category: "jobs",
    content:
      "My team at the Celtics is hiring a Basketball Analytics Intern for Summer 2026. You'd be working with player tracking data, building R Shiny dashboards, and supporting the coaching staff with in-game strategy models. DM me for the link or check the job board. Bryant grads strongly preferred!",
    reactions: [
      { emoji: "\uD83D\uDC4D", label: "Upvote", count: 47 },
      { emoji: "\uD83D\uDCA1", label: "Insightful", count: 12 },
      { emoji: "\uD83D\uDD25", label: "Fire", count: 31 },
      { emoji: "\uD83D\uDC4F", label: "Clap", count: 22 },
    ],
    commentCount: 14,
    comments: [
      {
        id: "c6",
        author: { name: "Tyler Brooks" },
        content: "This is amazing! Just sent you a DM. I've been building player tracking visualizations all semester.",
        timeAgo: "5 hours ago",
      },
      {
        id: "c7",
        author: { name: "Emma Gonzalez" },
        content: "Congrats to whoever lands this. Sarah mentored me last year and the Celtics analytics team is top-tier.",
        timeAgo: "4 hours ago",
      },
    ],
  },
  {
    id: "4",
    author: { name: "Alyssa Rivera", role: "Student", roleBadgeVariant: "default" },
    timeAgo: "8 hours ago",
    category: "all",
    content:
      "Just published my NBA Draft Big Board project on the portfolio! Used K-means clustering on college stats to group prospects by play style and compared them to historical NBA players. Would love feedback from anyone who's done similar work.",
    link: { url: "#", label: "bryant-analytics.dev/projects/nba-draft-big-board-clustering" },
    hasImage: true,
    reactions: [
      { emoji: "\uD83D\uDC4D", label: "Upvote", count: 33 },
      { emoji: "\uD83D\uDCA1", label: "Insightful", count: 21 },
      { emoji: "\uD83D\uDD25", label: "Fire", count: 15 },
      { emoji: "\uD83D\uDC4F", label: "Clap", count: 28 },
    ],
    commentCount: 9,
    comments: [
      {
        id: "c8",
        author: { name: "Dr. Kevin Bahr", role: "Faculty" },
        content: "Excellent work, Alyssa. The silhouette analysis for choosing K was a nice touch. Consider adding DBSCAN as a comparison.",
        timeAgo: "7 hours ago",
      },
    ],
  },
  {
    id: "5",
    author: { name: "Ryan O'Sullivan", role: "Student", roleBadgeVariant: "default" },
    timeAgo: "12 hours ago",
    category: "hottakes",
    content:
      "Hot take: WAR is the most overrated stat in baseball analytics. It tries to boil an entire season down to one number and the different implementations (fWAR vs bWAR) can't even agree with each other. We need to move past single-number player evaluation. Fight me.",
    reactions: [
      { emoji: "\uD83D\uDC4D", label: "Upvote", count: 19 },
      { emoji: "\uD83D\uDCA1", label: "Insightful", count: 8 },
      { emoji: "\uD83D\uDD25", label: "Fire", count: 26 },
      { emoji: "\uD83D\uDC4F", label: "Clap", count: 4 },
    ],
    commentCount: 22,
    comments: [
      {
        id: "c9",
        author: { name: "Marcus Chen" },
        content: "Hard disagree. WAR isn't perfect but it's the best quick comparison tool we have. The alternative is no summary stat at all.",
        timeAgo: "11 hours ago",
      },
      {
        id: "c10",
        author: { name: "Jake Thompson" },
        content: "The fWAR vs bWAR discrepancy is actually a feature, not a bug. Different defensive models capture different things.",
        timeAgo: "10 hours ago",
      },
    ],
  },
  {
    id: "6",
    author: { name: "David Kim", role: "Student", roleBadgeVariant: "default" },
    timeAgo: "1 day ago",
    category: "datasets",
    content:
      "Sharing a cleaned dataset of every March Madness tournament game from 2000-2025 with KenPom ratings, seed matchups, and tempo-adjusted efficiency stats. CSV + data dictionary in the link. Free to use for class projects -- just give credit!",
    link: { url: "#", label: "github.com/dkim-analytics/march-madness-data" },
    reactions: [
      { emoji: "\uD83D\uDC4D", label: "Upvote", count: 56 },
      { emoji: "\uD83D\uDCA1", label: "Insightful", count: 14 },
      { emoji: "\uD83D\uDD25", label: "Fire", count: 9 },
      { emoji: "\uD83D\uDC4F", label: "Clap", count: 19 },
    ],
    commentCount: 11,
    comments: [],
  },
  {
    id: "7",
    author: { name: "Mike Picone", role: "Alumni - ESPN", roleBadgeVariant: "sport" },
    timeAgo: "1 day ago",
    category: "articles",
    content:
      "Wrote up a piece on how we're using NLP at ESPN to analyze post-game press conference transcripts for sentiment trends. The correlation between coach sentiment shifts and team performance over the following 5 games is surprisingly strong.",
    link: { url: "#", label: "espn.com/insider/nlp-press-conferences" },
    reactions: [
      { emoji: "\uD83D\uDC4D", label: "Upvote", count: 38 },
      { emoji: "\uD83D\uDCA1", label: "Insightful", count: 29 },
      { emoji: "\uD83D\uDD25", label: "Fire", count: 17 },
      { emoji: "\uD83D\uDC4F", label: "Clap", count: 11 },
    ],
    commentCount: 7,
    comments: [],
  },
  {
    id: "8",
    author: { name: "Priya Patel", role: "Student", roleBadgeVariant: "default" },
    timeAgo: "2 days ago",
    category: "questions",
    content:
      "Has anyone worked with NBA player tracking data from the Second Spectrum API? I'm trying to build an injury prediction model using workload metrics but the data format is a bit confusing. Any documentation or tutorials would be super helpful.",
    reactions: [
      { emoji: "\uD83D\uDC4D", label: "Upvote", count: 8 },
      { emoji: "\uD83D\uDCA1", label: "Insightful", count: 2 },
      { emoji: "\uD83D\uDD25", label: "Fire", count: 0 },
      { emoji: "\uD83D\uDC4F", label: "Clap", count: 1 },
    ],
    commentCount: 5,
    comments: [
      {
        id: "c11",
        author: { name: "Sarah Mitchell", role: "Alumni - Boston Celtics" },
        content: "DM me -- I can share some starter notebooks we use internally (non-proprietary stuff). The JSON schema is tricky at first.",
        timeAgo: "1 day ago",
      },
    ],
  },
];

const CATEGORY_TABS = [
  { value: "all", label: "All" },
  { value: "questions", label: "Questions" },
  { value: "jobs", label: "Job Leads" },
  { value: "articles", label: "Articles" },
  { value: "datasets", label: "Datasets" },
  { value: "hottakes", label: "Hot Takes" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function FeedPage() {
  const [category, setCategory] = useState("all");
  const [composeText, setComposeText] = useState("");
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [reactedPosts, setReactedPosts] = useState<Record<string, Set<string>>>({});

  const filteredPosts =
    category === "all"
      ? MOCK_POSTS
      : MOCK_POSTS.filter((p) => p.category === category);

  function toggleComments(postId: string) {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  }

  function toggleReaction(postId: string, label: string) {
    setReactedPosts((prev) => {
      const existing = new Set(prev[postId] || []);
      if (existing.has(label)) {
        existing.delete(label);
      } else {
        existing.add(label);
      }
      return { ...prev, [postId]: existing };
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Compose Box */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Avatar name="Ben Schubbe" size="md" />
            <textarea
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
              className="block w-full rounded-lg border border-bryant-gray-300 px-3 py-2 text-sm text-bryant-gray-900 placeholder:text-bryant-gray-400 focus:border-bryant-gold focus:outline-none focus:ring-2 focus:ring-bryant-gold focus:ring-offset-0 transition-colors resize-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <Button variant="ghost" size="sm">
                <Image className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Link2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Code className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="primary" size="sm" disabled={!composeText.trim()}>
              Post
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <Tabs activeTab={category} onTabChange={setCategory}>
        <TabList className="overflow-x-auto">
          {CATEGORY_TABS.map((t) => (
            <Tab key={t.value} value={t.value}>
              {t.label}
            </Tab>
          ))}
        </TabList>

        {/* All tabs render the same filtered list */}
        {CATEGORY_TABS.map((t) => (
          <TabPanel key={t.value} value={t.value}>
            <div className="space-y-4">
              {filteredPosts.length === 0 ? (
                <p className="py-12 text-center text-sm text-bryant-gray-500">
                  No posts in this category yet.
                </p>
              ) : (
                filteredPosts.map((post) => {
                  const isExpanded = expandedComments[post.id];
                  const myReactions = reactedPosts[post.id] || new Set();

                  return (
                    <Card key={post.id}>
                      <CardContent className="space-y-3">
                        {/* Author row */}
                        <div className="flex items-center gap-3">
                          <Avatar name={post.author.name} size="md" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-bryant-gray-900">
                                {post.author.name}
                              </span>
                              {post.author.role && (
                                <Badge variant={post.author.roleBadgeVariant || "default"}>
                                  {post.author.role}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-bryant-gray-500">{post.timeAgo}</p>
                          </div>
                        </div>

                        {/* Content */}
                        <p className="text-sm text-bryant-gray-800 whitespace-pre-line">
                          {post.content}
                        </p>

                        {/* Link */}
                        {post.link && (
                          <a
                            href={post.link.url}
                            className="block text-sm text-bryant-gold hover:underline truncate"
                          >
                            {post.link.label}
                          </a>
                        )}

                        {/* Image placeholder */}
                        {post.hasImage && (
                          <div className="rounded-lg bg-bryant-gray-100 h-48 flex items-center justify-center">
                            <Image className="h-8 w-8 text-bryant-gray-400" />
                          </div>
                        )}

                        {/* Reactions */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {post.reactions.map((r) => {
                            const active = myReactions.has(r.label);
                            return (
                              <button
                                key={r.label}
                                onClick={() => toggleReaction(post.id, r.label)}
                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                  active
                                    ? "bg-bryant-gold/10 text-bryant-gold border border-bryant-gold"
                                    : "bg-bryant-gray-100 text-bryant-gray-600 hover:bg-bryant-gray-200 border border-transparent"
                                }`}
                              >
                                <span>{r.emoji}</span>
                                <span>{r.label}</span>
                                <span className="ml-0.5 font-semibold">
                                  {active ? r.count + 1 : r.count}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Comment toggle */}
                        <div className="flex items-center gap-4 border-t border-bryant-gray-200 pt-2">
                          <button
                            onClick={() => toggleComments(post.id)}
                            className="inline-flex items-center gap-1.5 text-sm text-bryant-gray-500 hover:text-bryant-gold transition-colors"
                          >
                            <MessageSquare className="h-4 w-4" />
                            {post.commentCount} comments
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => toggleComments(post.id)}
                            className="text-sm font-medium text-bryant-gold hover:underline"
                          >
                            Reply
                          </button>
                        </div>

                        {/* Comment thread */}
                        {isExpanded && (
                          <div className="space-y-3 pl-4 border-l-2 border-bryant-gray-200">
                            {post.comments.length === 0 ? (
                              <p className="text-xs text-bryant-gray-400 italic">
                                No comments to display.
                              </p>
                            ) : (
                              post.comments.map((c) => (
                                <div key={c.id} className="flex gap-2">
                                  <Avatar name={c.author.name} size="sm" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-medium text-bryant-gray-900">
                                        {c.author.name}
                                      </span>
                                      {c.author.role && (
                                        <Badge variant="default">{c.author.role}</Badge>
                                      )}
                                      <span className="text-xs text-bryant-gray-400">
                                        {c.timeAgo}
                                      </span>
                                    </div>
                                    <p className="text-sm text-bryant-gray-700 mt-0.5">
                                      {c.content}
                                    </p>
                                  </div>
                                </div>
                              ))
                            )}

                            {/* Reply input */}
                            <div className="flex gap-2 pt-1">
                              <Avatar name="Ben Schubbe" size="sm" />
                              <div className="flex flex-1 gap-2">
                                <input
                                  type="text"
                                  placeholder="Write a reply..."
                                  className="block w-full rounded-lg border border-bryant-gray-300 px-3 py-1.5 text-sm text-bryant-gray-900 placeholder:text-bryant-gray-400 focus:border-bryant-gold focus:outline-none focus:ring-2 focus:ring-bryant-gold focus:ring-offset-0 transition-colors"
                                />
                                <Button variant="primary" size="sm">
                                  <Send className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}
