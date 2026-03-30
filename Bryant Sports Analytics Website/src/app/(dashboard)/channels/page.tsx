"use client";

import React, { useState, useMemo } from "react";
import { Hash, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ------------------------------------------------------------------ */
/*  Types & data                                                       */
/* ------------------------------------------------------------------ */

interface Channel {
  id: string;
  name: string;
  type: "Sport" | "Class" | "Club" | "General";
  typeBadgeVariant: "sport" | "technique" | "tool" | "domain";
  members: number;
  description: string;
  joined: boolean;
}

const MOCK_CHANNELS: Channel[] = [
  {
    id: "nfl-analytics",
    name: "nfl-analytics",
    type: "Sport",
    typeBadgeVariant: "sport",
    members: 184,
    description:
      "Everything NFL analytics: EPA models, nflFastR, combine data, draft modeling, and game-day strategy breakdowns.",
    joined: true,
  },
  {
    id: "nba-analytics",
    name: "nba-analytics",
    type: "Sport",
    typeBadgeVariant: "sport",
    members: 211,
    description:
      "NBA stats, player tracking, Second Spectrum, lineup optimization, and all things basketball analytics.",
    joined: true,
  },
  {
    id: "mlb-analytics",
    name: "mlb-analytics",
    type: "Sport",
    typeBadgeVariant: "sport",
    members: 156,
    description:
      "Statcast deep dives, pitch modeling, WAR debates, sabermetrics discussions, and FanGraphs analysis.",
    joined: false,
  },
  {
    id: "isa-340",
    name: "isa-340",
    type: "Class",
    typeBadgeVariant: "technique",
    members: 34,
    description:
      "Official channel for ISA 340 - Sports Analytics. Homework help, project collaboration, and lecture discussions.",
    joined: true,
  },
  {
    id: "sports-analytics-club",
    name: "sports-analytics-club",
    type: "Club",
    typeBadgeVariant: "tool",
    members: 97,
    description:
      "Bryant Sports Analytics Club announcements, meeting notes, guest speaker info, and competition teams.",
    joined: true,
  },
  {
    id: "job-alerts",
    name: "job-alerts",
    type: "General",
    typeBadgeVariant: "domain",
    members: 268,
    description:
      "Sports analytics job postings, internship opportunities, career advice, and application tips from alumni.",
    joined: true,
  },
  {
    id: "python-help",
    name: "python-help",
    type: "General",
    typeBadgeVariant: "domain",
    members: 143,
    description:
      "Python troubleshooting, library recommendations, code reviews, and best practices for sports data work.",
    joined: false,
  },
  {
    id: "r-help",
    name: "r-help",
    type: "General",
    typeBadgeVariant: "domain",
    members: 89,
    description:
      "R programming help, tidyverse tips, Shiny app development, and ggplot2 visualization techniques.",
    joined: false,
  },
  {
    id: "general",
    name: "general",
    type: "General",
    typeBadgeVariant: "domain",
    members: 312,
    description:
      "General discussion for the Bryant Sports Analytics community. Introductions, news, and off-topic banter.",
    joined: true,
  },
  {
    id: "introductions",
    name: "introductions",
    type: "General",
    typeBadgeVariant: "domain",
    members: 305,
    description:
      "New to the community? Introduce yourself! Share your background, interests, and what you hope to learn.",
    joined: true,
  },
  {
    id: "datasets",
    name: "datasets",
    type: "General",
    typeBadgeVariant: "domain",
    members: 178,
    description:
      "Share and request sports datasets. Public APIs, scraped data, cleaned CSVs, and database dumps.",
    joined: false,
  },
  {
    id: "hot-takes",
    name: "hot-takes",
    type: "General",
    typeBadgeVariant: "domain",
    members: 134,
    description:
      "Your spiciest sports analytics opinions. Debate WAR, clutch stats, model accuracy, and everything in between.",
    joined: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ChannelsPage() {
  const [search, setSearch] = useState("");
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>(
    Object.fromEntries(MOCK_CHANNELS.map((ch) => [ch.id, ch.joined])),
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return MOCK_CHANNELS;
    const q = search.toLowerCase();
    return MOCK_CHANNELS.filter(
      (ch) =>
        ch.name.toLowerCase().includes(q) ||
        ch.description.toLowerCase().includes(q) ||
        ch.type.toLowerCase().includes(q),
    );
  }, [search]);

  function toggleJoin(id: string) {
    setJoinedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-bryant-gray-900">Channels</h1>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bryant-gray-400" />
        <input
          type="text"
          placeholder="Search channels..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="block w-full rounded-lg border border-bryant-gray-300 py-2 pl-9 pr-3 text-sm text-bryant-gray-900 placeholder:text-bryant-gray-400 focus:border-bryant-gold focus:outline-none focus:ring-2 focus:ring-bryant-gold focus:ring-offset-0 transition-colors"
        />
      </div>

      {/* Channel Grid */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-bryant-gray-500">
          No channels match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ch) => {
            const isJoined = joinedMap[ch.id];
            return (
              <Card key={ch.id} className="flex flex-col hover:shadow-md transition-shadow">
                <CardContent className="flex flex-col flex-1 space-y-3">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bryant-gray-100 text-bryant-gray-600">
                        <Hash className="h-5 w-5" />
                      </div>
                      <span className="font-semibold text-bryant-gray-900 truncate text-sm">
                        {ch.name}
                      </span>
                    </div>
                    <Badge variant={ch.typeBadgeVariant}>{ch.type}</Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-bryant-gray-600 line-clamp-2 flex-1">
                    {ch.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="inline-flex items-center gap-1 text-xs text-bryant-gray-500">
                      <Users className="h-3.5 w-3.5" />
                      {ch.members} members
                    </span>
                    <Button
                      variant={isJoined ? "outline" : "primary"}
                      size="sm"
                      onClick={() => toggleJoin(ch.id)}
                    >
                      {isJoined ? "Joined" : "Join"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
