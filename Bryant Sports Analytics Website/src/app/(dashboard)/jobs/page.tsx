"use client";

import React, { useState } from "react";
import {
  Search,
  MapPin,
  Heart,
  ClipboardList,
  ExternalLink,
  Wifi,
  Award,
  Briefcase,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { truncate, timeAgo } from "@/lib/utils";

/* ---------- mock data ---------- */

interface Job {
  id: string;
  title: string;
  company: string;
  companyColor: string;
  location: string;
  postedDate: string;
  sports: string[];
  roleType: string;
  experienceLevel: string;
  remote: boolean;
  bryantConnection: boolean;
  description: string;
  url: string;
}

const JOBS: Job[] = [
  {
    id: "1",
    title: "Basketball Analytics Intern",
    company: "Boston Celtics (NBA)",
    companyColor: "bg-green-600",
    location: "Boston, MA",
    postedDate: "2026-03-25",
    sports: ["Basketball"],
    roleType: "Analyst",
    experienceLevel: "Intern",
    remote: false,
    bryantConnection: true,
    description:
      "Join the Celtics analytics department to support game-day preparation, player evaluation, and strategic decision-making. You will build dashboards, run statistical models on Second Spectrum tracking data, and present findings to coaching staff. Ideal candidates are pursuing a degree in data science or statistics with strong Python and SQL skills.",
    url: "#",
  },
  {
    id: "2",
    title: "R&D Data Scientist - Baseball",
    company: "Los Angeles Dodgers (MLB)",
    companyColor: "bg-blue-700",
    location: "Los Angeles, CA",
    postedDate: "2026-03-20",
    sports: ["Baseball"],
    roleType: "Data Scientist",
    experienceLevel: "Mid-Level",
    remote: false,
    bryantConnection: false,
    description:
      "The R&D team is seeking a data scientist to develop pitch classification models, swing decision analysis tools, and predictive projection systems using Statcast data. You will collaborate with player development and scouting to build tools that inform roster construction and in-game strategy.",
    url: "#",
  },
  {
    id: "3",
    title: "Data Visualization Specialist - Sports",
    company: "ESPN",
    companyColor: "bg-red-600",
    location: "Bristol, CT",
    postedDate: "2026-03-22",
    sports: ["Basketball", "Football", "Baseball"],
    roleType: "Analyst",
    experienceLevel: "Entry-Level",
    remote: true,
    bryantConnection: true,
    description:
      "Create compelling interactive data visualizations for ESPN digital platforms. Work with editorial teams to translate complex sports statistics into accessible visual stories. Proficiency in D3.js, Tableau, or Observable required along with a strong understanding of sports metrics.",
    url: "#",
  },
  {
    id: "4",
    title: "Sports Modeler",
    company: "DraftKings",
    companyColor: "bg-emerald-600",
    location: "Boston, MA",
    postedDate: "2026-03-18",
    sports: ["Football", "Basketball", "Baseball"],
    roleType: "Data Scientist",
    experienceLevel: "Mid-Level",
    remote: true,
    bryantConnection: true,
    description:
      "Design and maintain predictive models for player performance projections, game outcomes, and pricing algorithms. Work with real-time data feeds and large-scale datasets. Strong background in probability theory, Bayesian statistics, and machine learning required.",
    url: "#",
  },
  {
    id: "5",
    title: "Scouting Analyst",
    company: "New England Patriots (NFL)",
    companyColor: "bg-blue-900",
    location: "Foxborough, MA",
    postedDate: "2026-03-15",
    sports: ["Football"],
    roleType: "Scout",
    experienceLevel: "Entry-Level",
    remote: false,
    bryantConnection: false,
    description:
      "Support the scouting department with film evaluation, player grading, and draft analytics. Combine traditional scouting insights with data-driven approaches using Next Gen Stats and PFF data. Attend pro days and assist in pre-draft evaluation processes.",
    url: "#",
  },
  {
    id: "6",
    title: "Data Engineer - Real-Time Sports Platform",
    company: "Sportradar",
    companyColor: "bg-orange-500",
    location: "New York, NY",
    postedDate: "2026-03-12",
    sports: ["Basketball", "Football", "Soccer"],
    roleType: "Data Engineer",
    experienceLevel: "Mid-Level",
    remote: true,
    bryantConnection: false,
    description:
      "Build and maintain real-time data pipelines for live sports events. Work with Kafka, Spark Streaming, and cloud infrastructure to deliver sub-second latency data feeds to clients worldwide. Experience with distributed systems and sports data formats preferred.",
    url: "#",
  },
  {
    id: "7",
    title: "Athletic Performance Research Coordinator",
    company: "Bryant University Athletics",
    companyColor: "bg-bryant-gold",
    location: "Smithfield, RI",
    postedDate: "2026-03-28",
    sports: ["Basketball", "Football", "Baseball"],
    roleType: "Researcher",
    experienceLevel: "Intern",
    remote: false,
    bryantConnection: true,
    description:
      "Work directly with Bryant coaching staff to collect, analyze, and report on athlete performance data. Build dashboards using wearable sensor data, GPS tracking, and video analysis. Great opportunity for hands-on experience in collegiate athletics analytics.",
    url: "#",
  },
  {
    id: "8",
    title: "Sports Analytics Consultant",
    company: "Wasserman (Sports Agency)",
    companyColor: "bg-gray-800",
    location: "Los Angeles, CA",
    postedDate: "2026-03-10",
    sports: ["Basketball", "Football"],
    roleType: "Strategist",
    experienceLevel: "Entry-Level",
    remote: false,
    bryantConnection: false,
    description:
      "Provide data-driven insights to support client contract negotiations, endorsement valuations, and career strategy. Build models for market value estimation and performance benchmarking across leagues. Work closely with agents and marketing teams.",
    url: "#",
  },
  {
    id: "9",
    title: "Quantitative Analyst - Sports Betting",
    company: "FanDuel",
    companyColor: "bg-blue-500",
    location: "New York, NY",
    postedDate: "2026-03-08",
    sports: ["Basketball", "Football", "Baseball"],
    roleType: "Data Scientist",
    experienceLevel: "Entry-Level",
    remote: true,
    bryantConnection: true,
    description:
      "Develop quantitative models for odds-setting, risk management, and pricing optimization. Analyze betting market efficiency and build tools for traders. Strong background in statistics, probability, and programming (Python/R) required. Sports knowledge a major plus.",
    url: "#",
  },
  {
    id: "10",
    title: "Performance Analyst",
    company: "New England Revolution (MLS)",
    companyColor: "bg-blue-800",
    location: "Foxborough, MA",
    postedDate: "2026-03-05",
    sports: ["Soccer"],
    roleType: "Analyst",
    experienceLevel: "Entry-Level",
    remote: false,
    bryantConnection: false,
    description:
      "Analyze match and training data to support coaching decisions and player recruitment. Work with event data, tracking data, and video platforms. Create pre-match and post-match reports, build expected goals models, and contribute to the club data strategy.",
    url: "#",
  },
];

const SPORT_OPTIONS = [
  { value: "", label: "All Sports" },
  { value: "Basketball", label: "Basketball" },
  { value: "Football", label: "Football" },
  { value: "Baseball", label: "Baseball" },
  { value: "Soccer", label: "Soccer" },
];

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "Analyst", label: "Analyst" },
  { value: "Data Engineer", label: "Data Engineer" },
  { value: "Data Scientist", label: "Data Scientist" },
  { value: "Scout", label: "Scout" },
  { value: "Researcher", label: "Researcher" },
  { value: "Strategist", label: "Strategist" },
];

const EXPERIENCE_OPTIONS = [
  { value: "", label: "All Levels" },
  { value: "Intern", label: "Intern" },
  { value: "Entry-Level", label: "Entry-Level" },
  { value: "Mid-Level", label: "Mid-Level" },
];

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [sport, setSport] = useState("");
  const [roleType, setRoleType] = useState("");
  const [experience, setExperience] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [trackedJobs, setTrackedJobs] = useState<Set<string>>(new Set());

  const filtered = JOBS.filter((job) => {
    if (search && !job.title.toLowerCase().includes(search.toLowerCase()) && !job.company.toLowerCase().includes(search.toLowerCase())) return false;
    if (sport && !job.sports.includes(sport)) return false;
    if (roleType && job.roleType !== roleType) return false;
    if (experience && job.experienceLevel !== experience) return false;
    if (remoteOnly && !job.remote) return false;
    return true;
  });

  function toggleSaved(id: string) {
    setSavedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTracked(id: string) {
    setTrackedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const levelBadgeVariant = (level: string) => {
    if (level === "Intern") return "success";
    if (level === "Entry-Level") return "tool";
    return "technique";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-bryant-gray-900">
          Job & Internship Board
        </h1>
        <p className="mt-1 text-sm text-bryant-gray-500">
          Discover sports analytics opportunities curated for Bryant students
        </p>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-bryant-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs or companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full rounded-lg border border-bryant-gray-300 pl-10 pr-3 py-2 text-sm text-bryant-gray-900 placeholder:text-bryant-gray-400 focus:outline-none focus:ring-2 focus:ring-bryant-gold focus:border-bryant-gold"
                />
              </div>
            </div>
            <div className="w-40">
              <Select
                options={SPORT_OPTIONS}
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                placeholder="Sport"
              />
            </div>
            <div className="w-44">
              <Select
                options={ROLE_OPTIONS}
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
                placeholder="Role Type"
              />
            </div>
            <div className="w-40">
              <Select
                options={EXPERIENCE_OPTIONS}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Experience"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-bryant-gray-700 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="h-4 w-4 rounded border-bryant-gray-300 text-bryant-gold focus:ring-bryant-gold"
              />
              Remote Only
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <p className="text-sm text-bryant-gray-500">
        Showing {filtered.length} {filtered.length === 1 ? "position" : "positions"}
      </p>

      {/* Job Listings */}
      <div className="space-y-4">
        {filtered.map((job) => (
          <Card key={job.id}>
            <CardContent className="py-5">
              <div className="flex gap-4">
                {/* Company Logo Placeholder */}
                <div
                  className={`h-12 w-12 rounded-lg ${job.companyColor} flex items-center justify-center text-white font-bold text-lg shrink-0`}
                >
                  {job.company[0]}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-bryant-gray-500">
                          {job.company}
                        </span>
                        {job.bryantConnection && (
                          <Badge className="bg-bryant-gold/10 text-bryant-gold border border-bryant-gold/30">
                            <Award className="h-3 w-3 mr-1" />
                            Bryant Connection
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-bryant-gray-900 mt-0.5">
                        {job.title}
                      </h3>
                    </div>
                  </div>

                  {/* Location and date */}
                  <div className="flex items-center gap-4 mt-1 text-sm text-bryant-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {timeAgo(job.postedDate)}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.sports.map((s) => (
                      <Badge key={s} variant="sport">
                        {s}
                      </Badge>
                    ))}
                    <Badge variant="technique">{job.roleType}</Badge>
                    <Badge variant={levelBadgeVariant(job.experienceLevel)}>
                      {job.experienceLevel}
                    </Badge>
                    {job.remote && (
                      <Badge variant="domain">
                        <Wifi className="h-3 w-3 mr-1" />
                        Remote
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-sm text-bryant-gray-600 line-clamp-3">
                    {truncate(job.description, 240)}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => window.open(job.url, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Apply
                </Button>
                <Button
                  variant={savedJobs.has(job.id) ? "primary" : "outline"}
                  size="sm"
                  onClick={() => toggleSaved(job.id)}
                >
                  <Heart
                    className={`h-4 w-4 ${savedJobs.has(job.id) ? "fill-white" : ""}`}
                  />
                  {savedJobs.has(job.id) ? "Saved" : "Save"}
                </Button>
                <Button
                  variant={trackedJobs.has(job.id) ? "primary" : "outline"}
                  size="sm"
                  onClick={() => toggleTracked(job.id)}
                >
                  <ClipboardList className="h-4 w-4" />
                  {trackedJobs.has(job.id) ? "Tracking" : "Track"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Briefcase className="mx-auto h-10 w-10 text-bryant-gray-300" />
                <h3 className="mt-3 text-lg font-semibold text-bryant-gray-900">
                  No positions found
                </h3>
                <p className="mt-1 text-sm text-bryant-gray-500">
                  Try adjusting your filters to see more results.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
