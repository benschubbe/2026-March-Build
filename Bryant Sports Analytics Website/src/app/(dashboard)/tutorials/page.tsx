"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Eye,
  Star,
  PenLine,
  BookMarked,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { truncate, formatDate } from "@/lib/utils";

interface Tutorial {
  slug: string;
  title: string;
  description: string;
  author: { name: string; avatar?: string };
  category: string;
  tools: string[];
  staffPick: boolean;
  views: number;
  rating: number;
  publishedAt: string;
}

const MOCK_TUTORIALS: Tutorial[] = [
  {
    slug: "getting-started-nflfastr-r",
    title: "Getting Started with nflFastR in R",
    description:
      "Learn how to install nflFastR, load play-by-play data, and perform your first analyses of NFL offensive efficiency using EPA per play. Includes step-by-step code examples and visualization with ggplot2.",
    author: { name: "Marcus Chen" },
    category: "R",
    tools: ["R", "nflFastR", "ggplot2"],
    staffPick: true,
    views: 1247,
    rating: 4.9,
    publishedAt: "2026-02-15",
  },
  {
    slug: "web-scraping-basketball-reference-python",
    title: "Web Scraping Basketball Reference with Python",
    description:
      "A practical guide to scraping NBA player statistics from Basketball Reference using BeautifulSoup and requests. Covers pagination, data cleaning, and exporting to CSV for further analysis.",
    author: { name: "Jake Thompson" },
    category: "Web Scraping",
    tools: ["Python", "BeautifulSoup", "pandas"],
    staffPick: false,
    views: 892,
    rating: 4.6,
    publishedAt: "2026-02-20",
  },
  {
    slug: "sql-sports-analytics-essential-queries",
    title: "SQL for Sports Analytics: Essential Queries",
    description:
      "Master the SQL queries every sports analyst needs, from aggregating player stats to calculating rolling averages, ranking functions, and building efficiency metrics across seasons.",
    author: { name: "Emma Gonzalez" },
    category: "SQL",
    tools: ["SQL", "PostgreSQL"],
    staffPick: false,
    views: 1534,
    rating: 4.7,
    publishedAt: "2026-01-10",
  },
  {
    slug: "building-interactive-dashboards-plotly",
    title: "Building Interactive Dashboards with Plotly",
    description:
      "Create stunning interactive sports analytics dashboards using Plotly and Dash in Python. Build scatter plots, shot charts, and time series visualizations that your audience can explore.",
    author: { name: "Alyssa Rivera" },
    category: "Data Visualization",
    tools: ["Python", "Plotly", "Dash"],
    staffPick: false,
    views: 756,
    rating: 4.5,
    publishedAt: "2026-03-01",
  },
  {
    slug: "accessing-statcast-data-pybaseball",
    title: "Accessing Statcast Data with pybaseball",
    description:
      "Learn to pull pitch-level and batted-ball Statcast data using the pybaseball library. Covers data retrieval, filtering by date range and player, and initial exploratory analysis of pitch movement profiles.",
    author: { name: "David Kim" },
    category: "Python",
    tools: ["Python", "pybaseball", "pandas"],
    staffPick: false,
    views: 643,
    rating: 4.4,
    publishedAt: "2026-01-25",
  },
  {
    slug: "introduction-expected-goals-xg-modeling",
    title: "Introduction to Expected Goals (xG) Modeling",
    description:
      "Build your first expected goals model from scratch using shot-level data. Covers feature engineering, logistic regression, model evaluation with log-loss, and interpreting xG values for match analysis.",
    author: { name: "Sofia Nguyen" },
    category: "Statistics",
    tools: ["Python", "scikit-learn", "pandas"],
    staffPick: false,
    views: 981,
    rating: 4.8,
    publishedAt: "2026-02-05",
  },
  {
    slug: "clustering-nba-players-scikit-learn",
    title: "Clustering NBA Players with scikit-learn",
    description:
      "Apply K-means and hierarchical clustering to NBA player statistics to discover player archetypes. Includes feature scaling, elbow method for optimal k, and visualizing clusters with PCA dimensionality reduction.",
    author: { name: "Priya Patel" },
    category: "Machine Learning",
    tools: ["Python", "scikit-learn", "matplotlib"],
    staffPick: false,
    views: 1102,
    rating: 4.7,
    publishedAt: "2026-03-10",
  },
  {
    slug: "nfl-next-gen-stats-tracking-data",
    title: "Working with NFL Next Gen Stats Tracking Data",
    description:
      "Explore NFL player tracking data from Next Gen Stats, including route running, separation metrics, and positional data. Learn to process and visualize tracking data for advanced football analytics.",
    author: { name: "Tyler Brooks" },
    category: "APIs",
    tools: ["Python", "pandas", "matplotlib"],
    staffPick: false,
    views: 568,
    rating: 4.3,
    publishedAt: "2026-02-28",
  },
  {
    slug: "tableau-tips-sports-visualizations",
    title: "Tableau Tips for Sports Visualizations",
    description:
      "Level up your Tableau dashboards with sports-specific design patterns. Covers shot charts, heat maps, bump charts for standings, and dual-axis techniques for comparing player performance metrics.",
    author: { name: "Ryan O'Sullivan" },
    category: "Data Visualization",
    tools: ["Tableau"],
    staffPick: true,
    views: 1389,
    rating: 4.8,
    publishedAt: "2026-01-18",
  },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "Python", label: "Python" },
  { value: "R", label: "R" },
  { value: "SQL", label: "SQL" },
  { value: "Data Visualization", label: "Data Visualization" },
  { value: "Web Scraping", label: "Web Scraping" },
  { value: "APIs", label: "APIs" },
  { value: "Statistics", label: "Statistics" },
  { value: "Machine Learning", label: "Machine Learning" },
];

function renderStars(rating: number) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const stars = [];
  for (let i = 0; i < full; i++) {
    stars.push(
      <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
    );
  }
  if (half) {
    stars.push(
      <Star
        key="half"
        className="h-3.5 w-3.5 fill-yellow-400/50 text-yellow-400"
      />
    );
  }
  return stars;
}

export default function TutorialsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [staffPickOnly, setStaffPickOnly] = useState(false);

  const filtered = useMemo(() => {
    return MOCK_TUTORIALS.filter((t) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.author.name.toLowerCase().includes(q) ||
        t.tools.some((tool) => tool.toLowerCase().includes(q));
      const matchesCategory = !category || t.category === category;
      const matchesStaffPick = !staffPickOnly || t.staffPick;
      return matchesSearch && matchesCategory && matchesStaffPick;
    });
  }, [search, category, staffPickOnly]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bryant-gray-900">
            Tutorials & Guides
          </h1>
          <p className="mt-1 text-sm text-bryant-gray-500">
            Learn from community-written tutorials covering tools, techniques, and workflows
          </p>
        </div>
        <Link href="/tutorials/new">
          <Button variant="primary">
            <PenLine className="h-4 w-4" />
            Write a Tutorial
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bryant-gray-400" />
              <input
                type="text"
                placeholder="Search tutorials..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full rounded-lg border border-bryant-gray-300 py-2 pl-9 pr-3 text-sm text-bryant-gray-900 placeholder:text-bryant-gray-400 focus:border-bryant-gold focus:outline-none focus:ring-2 focus:ring-bryant-gold focus:ring-offset-0 transition-colors"
              />
            </div>

            <div className="flex items-end gap-3">
              <Select
                options={CATEGORY_OPTIONS}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <button
                onClick={() => setStaffPickOnly(!staffPickOnly)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  staffPickOnly
                    ? "border-bryant-gold bg-bryant-gold/10 text-bryant-gold"
                    : "border-bryant-gray-300 text-bryant-gray-600 hover:bg-bryant-gray-50"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                Staff Picks
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tutorial Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookMarked className="h-12 w-12" />}
          title="No tutorials found"
          description="Try adjusting your search or filters to find tutorials."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setCategory("");
                setStaffPickOnly(false);
              }}
            >
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tutorial) => (
            <Card
              key={tutorial.slug}
              className="flex flex-col hover:shadow-md transition-shadow"
            >
              <CardContent className="flex-1 space-y-3">
                {/* Badges Row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="technique">{tutorial.category}</Badge>
                  {tutorial.staffPick && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Sparkles className="h-3 w-3 mr-0.5" />
                      Staff Pick
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <Link
                  href={`/tutorials/${tutorial.slug}`}
                  className="block text-lg font-semibold text-bryant-gray-900 hover:text-bryant-gold transition-colors line-clamp-2"
                >
                  {tutorial.title}
                </Link>

                {/* Author */}
                <div className="flex items-center gap-2">
                  <Avatar name={tutorial.author.name} size="sm" />
                  <span className="text-sm font-medium text-bryant-gray-700">
                    {tutorial.author.name}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-bryant-gray-600 line-clamp-2">
                  {truncate(tutorial.description, 120)}
                </p>

                {/* Tool Badges */}
                <div className="flex flex-wrap gap-1">
                  {tutorial.tools.map((tool) => (
                    <Badge key={tool} variant="tool">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </CardContent>

              {/* Footer */}
              <CardFooter className="flex items-center justify-between text-sm text-bryant-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {tutorial.views.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-0.5">
                  {renderStars(tutorial.rating)}
                  <span className="ml-1">{tutorial.rating}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(tutorial.publishedAt)}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
