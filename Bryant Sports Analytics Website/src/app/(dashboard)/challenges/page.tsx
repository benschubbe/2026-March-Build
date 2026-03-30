"use client";

import React from "react";
import Link from "next/link";
import {
  Trophy,
  Clock,
  Users,
  Upload,
  Eye,
  Flame,
  Medal,
  Target,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";

interface PastChallenge {
  slug: string;
  title: string;
  sport: string;
  dateRange: string;
  submissionCount: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  winner: { name: string; avatar?: string };
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar?: string;
  wins: number;
  submissions: number;
  points: number;
  isCurrentUser?: boolean;
}

const ACTIVE_CHALLENGE = {
  title: "Predict March Madness Upsets",
  sport: "College",
  description:
    "Use regular-season team statistics, strength of schedule, and historical tournament data to build a model that predicts first-round upsets in the NCAA Tournament. Your model should output an upset probability for each matchup where the lower seed is favored.",
  datasetLink: "#",
  deadline: "2026-04-02",
  submissionCount: 23,
};

const PAST_CHALLENGES: PastChallenge[] = [
  {
    slug: "nfl-passer-rating-alternative",
    title: "Build an NFL Passer Rating Alternative",
    sport: "NFL",
    dateRange: "Mar 1 - Mar 14, 2026",
    submissionCount: 31,
    difficulty: "Intermediate",
    winner: { name: "Marcus Chen" },
  },
  {
    slug: "mlb-pitch-clustering-kmeans",
    title: "MLB Pitch Clustering with K-Means",
    sport: "MLB",
    dateRange: "Feb 15 - Feb 28, 2026",
    submissionCount: 27,
    difficulty: "Intermediate",
    winner: { name: "Jake Thompson" },
  },
  {
    slug: "nba-win-probability-model",
    title: "NBA Win Probability Model",
    sport: "NBA",
    dateRange: "Feb 1 - Feb 14, 2026",
    submissionCount: 35,
    difficulty: "Advanced",
    winner: { name: "Priya Patel" },
  },
  {
    slug: "premier-league-xg-from-scratch",
    title: "Premier League xG from Scratch",
    sport: "Soccer",
    dateRange: "Jan 15 - Jan 28, 2026",
    submissionCount: 22,
    difficulty: "Advanced",
    winner: { name: "Sofia Nguyen" },
  },
  {
    slug: "cfb-recruiting-value-model",
    title: "College Football Recruiting Value Model",
    sport: "College",
    dateRange: "Jan 1 - Jan 14, 2026",
    submissionCount: 19,
    difficulty: "Beginner",
    winner: { name: "Tyler Brooks" },
  },
];

const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "Marcus Chen", wins: 4, submissions: 12, points: 1240 },
  { rank: 2, name: "Priya Patel", wins: 3, submissions: 11, points: 1105 },
  { rank: 3, name: "Jake Thompson", wins: 3, submissions: 10, points: 1050 },
  { rank: 4, name: "Sofia Nguyen", wins: 2, submissions: 9, points: 920 },
  { rank: 5, name: "Tyler Brooks", wins: 2, submissions: 8, points: 870 },
  { rank: 6, name: "Alyssa Rivera", wins: 1, submissions: 10, points: 810 },
  { rank: 7, name: "David Kim", wins: 1, submissions: 7, points: 690, isCurrentUser: true },
  { rank: 8, name: "Emma Gonzalez", wins: 1, submissions: 6, points: 620 },
  { rank: 9, name: "Ryan O'Sullivan", wins: 0, submissions: 8, points: 540 },
  { rank: 10, name: "Jordan Lee", wins: 0, submissions: 5, points: 380 },
];

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner: "bg-green-100 text-green-800",
  Intermediate: "bg-amber-100 text-amber-800",
  Advanced: "bg-red-100 text-red-800",
};

function daysLeft(deadline: string): number {
  const now = new Date();
  const end = new Date(deadline);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
}

export default function ChallengesPage() {
  const remaining = daysLeft(ACTIVE_CHALLENGE.deadline);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-bryant-gray-900">
          Weekly Challenges
        </h1>
        <p className="mt-1 text-sm text-bryant-gray-500">
          Compete with fellow analysts, sharpen your skills, and build your portfolio
        </p>
      </div>

      {/* Active Challenge */}
      <Card className="border-2 border-bryant-gold">
        <CardHeader className="bg-gradient-to-r from-bryant-gold to-yellow-500">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-white" />
            <span className="text-sm font-semibold text-white uppercase tracking-wider">
              This Week&apos;s Challenge
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-bryant-gray-900">
                  {ACTIVE_CHALLENGE.title}
                </h2>
                <Badge variant="sport">{ACTIVE_CHALLENGE.sport}</Badge>
              </div>
              <p className="text-sm text-bryant-gray-600 leading-relaxed max-w-2xl">
                {ACTIVE_CHALLENGE.description}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-bryant-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold text-bryant-gray-900">
                    {remaining} day{remaining !== 1 ? "s" : ""} left
                  </span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {ACTIVE_CHALLENGE.submissionCount} submissions
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  Due {formatDate(ACTIVE_CHALLENGE.deadline)}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:items-end shrink-0">
              <Button variant="primary" size="lg">
                <Upload className="h-4 w-4" />
                Submit Solution
              </Button>
              <Link
                href="#"
                className="text-sm text-bryant-gold hover:underline text-center"
              >
                Download Dataset
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content: Past Challenges + Leaderboard */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Past Challenges */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-bryant-gray-900">
            Past Challenges
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {PAST_CHALLENGES.map((challenge) => (
              <Card key={challenge.slug} className="flex flex-col hover:shadow-md transition-shadow">
                <CardContent className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-bryant-gray-900 leading-snug">
                      {challenge.title}
                    </h3>
                    <Badge variant="sport" className="shrink-0">
                      {challenge.sport}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-bryant-gray-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {challenge.dateRange}
                  </div>

                  <div className="flex items-center gap-2">
                    <Avatar name={challenge.winner.name} size="sm" />
                    <div className="text-sm">
                      <span className="font-medium text-bryant-gray-700">
                        {challenge.winner.name}
                      </span>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 ml-auto">
                      <Trophy className="h-3 w-3 mr-0.5" />
                      Winner
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-bryant-gray-500">
                      {challenge.submissionCount} submissions
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_STYLES[challenge.difficulty]}`}
                    >
                      {challenge.difficulty}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link
                    href={`/challenges/${challenge.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-bryant-gold hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Submissions
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-bryant-gray-900 flex items-center gap-2">
            <Medal className="h-5 w-5 text-bryant-gold" />
            Leaderboard
          </h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-bryant-gray-200 text-left text-xs uppercase tracking-wider text-bryant-gray-500">
                    <th className="px-4 py-3 w-10">#</th>
                    <th className="px-4 py-3">Analyst</th>
                    <th className="px-4 py-3 text-center">
                      <Trophy className="h-3.5 w-3.5 inline" />
                    </th>
                    <th className="px-4 py-3 text-right">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {LEADERBOARD.map((entry) => (
                    <tr
                      key={entry.rank}
                      className={`border-b border-bryant-gray-100 last:border-0 ${
                        entry.isCurrentUser
                          ? "bg-bryant-gold/5 font-medium"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        {entry.rank <= 3 ? (
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                              entry.rank === 1
                                ? "bg-yellow-500"
                                : entry.rank === 2
                                  ? "bg-gray-400"
                                  : "bg-amber-700"
                            }`}
                          >
                            {entry.rank}
                          </span>
                        ) : (
                          <span className="pl-1 text-bryant-gray-500">
                            {entry.rank}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={entry.name} size="sm" />
                          <div>
                            <span className="text-bryant-gray-900">
                              {entry.name}
                            </span>
                            {entry.isCurrentUser && (
                              <span className="ml-1 text-xs text-bryant-gold">(You)</span>
                            )}
                            <div className="text-xs text-bryant-gray-400">
                              {entry.submissions} submissions
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-bryant-gray-700">
                        {entry.wins}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-bryant-gray-900">
                        {entry.points.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="rounded-lg bg-bryant-gray-50 p-4 text-center">
            <Target className="mx-auto h-8 w-8 text-bryant-gold" />
            <p className="mt-2 text-sm font-medium text-bryant-gray-700">
              Your Rank: #7
            </p>
            <p className="text-xs text-bryant-gray-500">
              690 points &middot; 1 win &middot; 7 submissions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
