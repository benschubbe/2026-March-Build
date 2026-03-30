"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Eye, MessageSquare, Star, Plus, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { truncate, timeAgo } from "@/lib/utils";

interface Project {
  slug: string;
  title: string;
  abstract: string;
  sports: string[];
  techniques: string[];
  tools: string[];
  domains: string[];
  author: { name: string; avatar?: string };
  publishedAt: string;
  views: number;
  comments: number;
  rating: number;
  gradient: string;
}

const MOCK_PROJECTS: Project[] = [
  {
    slug: "nfl-expected-points-model-nflfastr",
    title: "NFL Expected Points Model Using nflFastR",
    abstract:
      "A comprehensive expected points added (EPA) model built on play-by-play data from nflFastR. Analyzes offensive efficiency across all 32 teams using logistic regression and gradient boosted trees, with interactive Tableau dashboards for visualization.",
    sports: ["NFL"],
    techniques: ["Regression", "Classification"],
    tools: ["Python", "R", "Tableau"],
    domains: ["In-Game Strategy", "Player Evaluation"],
    author: { name: "Marcus Chen" },
    publishedAt: "2026-03-15",
    views: 342,
    comments: 18,
    rating: 4.7,
    gradient: "from-green-700 to-green-900",
  },
  {
    slug: "nba-draft-big-board-clustering",
    title: "NBA Draft Big Board: Statistical Similarity Clustering",
    abstract:
      "Using K-means and hierarchical clustering on college basketball stats to group incoming NBA draft prospects by play style. Compares prospects to historical NBA players to project career trajectories and draft value.",
    sports: ["NBA"],
    techniques: ["Clustering"],
    tools: ["Python", "SQL"],
    domains: ["Draft Modeling", "Player Evaluation"],
    author: { name: "Alyssa Rivera" },
    publishedAt: "2026-03-10",
    views: 521,
    comments: 24,
    rating: 4.9,
    gradient: "from-orange-600 to-red-800",
  },
  {
    slug: "mlb-pitch-classification-random-forest",
    title: "MLB Pitch Classification with Random Forest",
    abstract:
      "Classifying pitch types from Statcast data using random forest and XGBoost models. Achieved 94% accuracy across 7 pitch types. Includes feature importance analysis and a Shiny app for exploring individual pitcher arsenals.",
    sports: ["MLB"],
    techniques: ["Classification"],
    tools: ["R", "SQL"],
    domains: ["Player Evaluation", "In-Game Strategy"],
    author: { name: "Jake Thompson" },
    publishedAt: "2026-02-28",
    views: 287,
    comments: 12,
    rating: 4.5,
    gradient: "from-red-700 to-blue-900",
  },
  {
    slug: "premier-league-xg-model",
    title: "Premier League xG Model",
    abstract:
      "Building an expected goals (xG) model for the English Premier League using shot-level data. Employs logistic regression and neural networks to estimate goal probability from shot location, body part, assist type, and game state features.",
    sports: ["MLS"],
    techniques: ["Regression", "Neural Networks"],
    tools: ["Python", "Tableau"],
    domains: ["In-Game Strategy"],
    author: { name: "Sofia Nguyen" },
    publishedAt: "2026-02-20",
    views: 198,
    comments: 9,
    rating: 4.3,
    gradient: "from-purple-700 to-indigo-900",
  },
  {
    slug: "march-madness-bracket-optimization",
    title: "March Madness Bracket Optimization",
    abstract:
      "A simulation-based approach to March Madness bracket optimization. Uses Monte Carlo simulation with team efficiency ratings, tempo-adjusted stats, and historical upset probabilities to maximize expected bracket score across millions of simulated tournaments.",
    sports: ["College"],
    techniques: ["Simulation", "Bayesian Inference"],
    tools: ["Python", "SQL"],
    domains: ["In-Game Strategy", "Betting Markets"],
    author: { name: "David Kim" },
    publishedAt: "2026-03-01",
    views: 876,
    comments: 41,
    rating: 4.8,
    gradient: "from-blue-700 to-cyan-900",
  },
  {
    slug: "nfl-combine-performance-clustering",
    title: "NFL Combine Performance Clustering",
    abstract:
      "Applying PCA and K-means clustering to NFL Combine measurables to identify athletic profiles among draft prospects. Reveals which physical archetypes translate to NFL success by position and links combine clusters to career outcomes.",
    sports: ["NFL"],
    techniques: ["Clustering"],
    tools: ["Python", "Tableau", "Excel"],
    domains: ["Draft Modeling", "Player Evaluation", "Recruiting"],
    author: { name: "Tyler Brooks" },
    publishedAt: "2026-01-18",
    views: 415,
    comments: 22,
    rating: 4.6,
    gradient: "from-gray-700 to-gray-900",
  },
  {
    slug: "nba-injury-prediction-time-series",
    title: "NBA Injury Prediction with Time Series Analysis",
    abstract:
      "Forecasting NBA player injury risk using time series models on workload, minutes, and biometric tracking data. Combines ARIMA-based fatigue modeling with gradient boosting classification to flag high-risk games for load management decisions.",
    sports: ["NBA"],
    techniques: ["Time Series", "Classification"],
    tools: ["Python", "SQL", "Power BI"],
    domains: ["Injury Prediction", "Player Evaluation"],
    author: { name: "Priya Patel" },
    publishedAt: "2026-02-10",
    views: 310,
    comments: 15,
    rating: 4.4,
    gradient: "from-rose-700 to-pink-900",
  },
  {
    slug: "mlb-ticket-pricing-optimization",
    title: "MLB Dynamic Ticket Pricing Optimization",
    abstract:
      "Using regression analysis and demand forecasting to model optimal ticket prices for MLB games. Incorporates opponent strength, day of week, weather, and promotional events as features to maximize revenue while maintaining attendance targets.",
    sports: ["MLB"],
    techniques: ["Regression", "Time Series"],
    tools: ["Python", "Tableau", "Excel"],
    domains: ["Ticket Pricing", "Fan Engagement"],
    author: { name: "Emma Gonzalez" },
    publishedAt: "2026-01-25",
    views: 163,
    comments: 7,
    rating: 4.2,
    gradient: "from-amber-700 to-yellow-900",
  },
  {
    slug: "nhl-web-scraping-player-dashboard",
    title: "NHL Player Dashboard via Web Scraping",
    abstract:
      "A full-stack web scraping pipeline collecting NHL player statistics from multiple sources, cleaned and stored in a PostgreSQL database. Powers an interactive Tableau dashboard with advanced on-ice metrics, RAPM, and WAR estimates.",
    sports: ["NHL"],
    techniques: ["Web Scraping"],
    tools: ["Python", "SQL", "Tableau"],
    domains: ["Player Evaluation", "Broadcast Analytics"],
    author: { name: "Ryan O'Sullivan" },
    publishedAt: "2026-03-20",
    views: 224,
    comments: 11,
    rating: 4.5,
    gradient: "from-sky-700 to-blue-900",
  },
];

const SPORT_OPTIONS = [
  { value: "", label: "All Sports" },
  { value: "NFL", label: "NFL" },
  { value: "NBA", label: "NBA" },
  { value: "MLB", label: "MLB" },
  { value: "NHL", label: "NHL" },
  { value: "MLS", label: "MLS" },
  { value: "College", label: "College" },
];

const TECHNIQUE_OPTIONS = [
  { value: "", label: "All Techniques" },
  { value: "Regression", label: "Regression" },
  { value: "Classification", label: "Classification" },
  { value: "Clustering", label: "Clustering" },
  { value: "Time Series", label: "Time Series" },
  { value: "NLP", label: "NLP" },
  { value: "Computer Vision", label: "Computer Vision" },
  { value: "Simulation", label: "Simulation" },
  { value: "Bayesian Inference", label: "Bayesian Inference" },
  { value: "Neural Networks", label: "Neural Networks" },
  { value: "Web Scraping", label: "Web Scraping" },
  { value: "Geospatial", label: "Geospatial" },
];

const TOOL_OPTIONS = [
  { value: "", label: "All Tools" },
  { value: "Python", label: "Python" },
  { value: "R", label: "R" },
  { value: "SQL", label: "SQL" },
  { value: "Tableau", label: "Tableau" },
  { value: "Power BI", label: "Power BI" },
  { value: "Excel", label: "Excel" },
  { value: "Stata", label: "Stata" },
  { value: "MATLAB", label: "MATLAB" },
  { value: "dbt", label: "dbt" },
  { value: "Spark", label: "Spark" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "most-viewed", label: "Most Viewed" },
  { value: "highest-rated", label: "Highest Rated" },
  { value: "most-discussed", label: "Most Discussed" },
];

export default function ProjectGalleryPage() {
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("");
  const [techniqueFilter, setTechniqueFilter] = useState("");
  const [toolFilter, setToolFilter] = useState("");
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(() => {
    let results = MOCK_PROJECTS.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.abstract.toLowerCase().includes(q) ||
        p.author.name.toLowerCase().includes(q);

      const matchesSport = !sportFilter || p.sports.includes(sportFilter);
      const matchesTechnique =
        !techniqueFilter || p.techniques.includes(techniqueFilter);
      const matchesTool = !toolFilter || p.tools.includes(toolFilter);

      return matchesSearch && matchesSport && matchesTechnique && matchesTool;
    });

    results = [...results].sort((a, b) => {
      switch (sort) {
        case "most-viewed":
          return b.views - a.views;
        case "highest-rated":
          return b.rating - a.rating;
        case "most-discussed":
          return b.comments - a.comments;
        default:
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
    });

    return results;
  }, [search, sportFilter, techniqueFilter, toolFilter, sort]);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-bryant-gray-900">
          Project Gallery
        </h1>
        <Link href="/projects/new">
          <Button variant="primary">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bryant-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full rounded-lg border border-bryant-gray-300 py-2 pl-9 pr-3 text-sm text-bryant-gray-900 placeholder:text-bryant-gray-400 focus:border-bryant-gold focus:outline-none focus:ring-2 focus:ring-bryant-gold focus:ring-offset-0 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:gap-3">
              <Select
                options={SPORT_OPTIONS}
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
              />
              <Select
                options={TECHNIQUE_OPTIONS}
                value={techniqueFilter}
                onChange={(e) => setTechniqueFilter(e.target.value)}
              />
              <Select
                options={TOOL_OPTIONS}
                value={toolFilter}
                onChange={(e) => setToolFilter(e.target.value)}
              />
              <Select
                options={SORT_OPTIONS}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-12 w-12" />}
          title="No projects found"
          description="Try adjusting your filters or search query to find what you're looking for."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setSportFilter("");
                setTechniqueFilter("");
                setToolFilter("");
                setSort("newest");
              }}
            >
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <Card key={project.slug} className="flex flex-col hover:shadow-md transition-shadow">
              {/* Thumbnail */}
              <div className={`relative h-40 bg-gradient-to-br ${project.gradient} flex items-center justify-center`}>
                <span className="text-4xl font-bold text-white/30">
                  {project.sports[0]}
                </span>
                {/* Sport Badges Overlay */}
                <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end">
                  {project.sports.map((sport) => (
                    <Badge key={sport} variant="sport" className="bg-white/90 text-blue-800 backdrop-blur-sm">
                      {sport}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Body */}
              <CardContent className="flex-1 space-y-3">
                <Link
                  href={`/projects/${project.slug}`}
                  className="block text-lg font-semibold text-bryant-gray-900 hover:text-bryant-gold transition-colors line-clamp-2"
                >
                  {project.title}
                </Link>

                <div className="flex items-center gap-2">
                  <Avatar name={project.author.name} size="sm" />
                  <div className="text-sm">
                    <span className="font-medium text-bryant-gray-700">
                      {project.author.name}
                    </span>
                    <span className="mx-1 text-bryant-gray-300">&middot;</span>
                    <span className="text-bryant-gray-500">
                      {timeAgo(project.publishedAt)}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-bryant-gray-600 line-clamp-2">
                  {truncate(project.abstract, 140)}
                </p>

                <div className="flex flex-wrap gap-1">
                  {project.tools.map((tool) => (
                    <Badge key={tool} variant="tool">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </CardContent>

              {/* Footer Stats */}
              <CardFooter className="flex items-center justify-between text-sm text-bryant-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {project.views}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {project.comments}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" />
                  {project.rating}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
