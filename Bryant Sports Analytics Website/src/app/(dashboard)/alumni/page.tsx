"use client";

import React, { useState, useMemo } from "react";
import { Search, UserPlus, ExternalLink, MapPin, Briefcase, GraduationCap, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";

interface Alumni {
  id: string;
  name: string;
  gradYear: number;
  title: string;
  company: string;
  sports: string[];
  expertise: string[];
  previousRoles: string[];
  tenure: string;
  availableForMentorship: boolean;
  quote?: string;
  featured?: boolean;
  employerType: string;
}

const MOCK_ALUMNI: Alumni[] = [
  {
    id: "sarah-chen",
    name: "Sarah Chen",
    gradYear: 2021,
    title: "Data Analyst",
    company: "Boston Celtics (NBA)",
    sports: ["NBA"],
    expertise: ["Player Tracking", "Shot Charts", "R/Shiny"],
    previousRoles: ["Analytics Intern, Boston Celtics", "RA, Bryant Sports Analytics Lab"],
    tenure: "3 years at Boston Celtics",
    availableForMentorship: true,
    employerType: "Team",
    featured: true,
    quote: "Bryant gave me the foundation to turn raw basketball data into actionable insights. The Sports Analytics concentration prepared me for exactly what I do every day with the Celtics.",
  },
  {
    id: "marcus-williams",
    name: "Marcus Williams",
    gradYear: 2020,
    title: "Baseball Operations Analyst",
    company: "Tampa Bay Rays (MLB)",
    sports: ["MLB"],
    expertise: ["Sabermetrics", "Pitch Modeling", "SQL", "Python"],
    previousRoles: ["Data Analyst, TrackMan", "Summer Analyst, Tampa Bay Rays"],
    tenure: "2 years at Tampa Bay Rays",
    availableForMentorship: true,
    employerType: "Team",
  },
  {
    id: "emily-rodriguez",
    name: "Emily Rodriguez",
    gradYear: 2022,
    title: "Football Research Analyst",
    company: "Philadelphia Eagles (NFL)",
    sports: ["NFL"],
    expertise: ["Expected Points", "Game Theory", "R", "Tableau"],
    previousRoles: ["Analytics Fellow, NFL League Office"],
    tenure: "2 years at Philadelphia Eagles",
    availableForMentorship: false,
    employerType: "Team",
  },
  {
    id: "james-park",
    name: "James Park",
    gradYear: 2019,
    title: "Senior Data Scientist",
    company: "ESPN",
    sports: ["NBA", "NFL"],
    expertise: ["Machine Learning", "NLP", "Content Analytics", "Python"],
    previousRoles: ["Data Scientist, ESPN", "Analyst, Stats Perform"],
    tenure: "4 years at ESPN",
    availableForMentorship: true,
    employerType: "Media",
  },
  {
    id: "aisha-johnson",
    name: "Aisha Johnson",
    gradYear: 2021,
    title: "Quantitative Analyst",
    company: "DraftKings",
    sports: ["NFL", "NBA"],
    expertise: ["Predictive Modeling", "Pricing", "Bayesian Stats", "Python"],
    previousRoles: ["Pricing Analyst, FanDuel"],
    tenure: "2 years at DraftKings",
    availableForMentorship: true,
    employerType: "Betting/DFS",
  },
  {
    id: "tyler-morrison",
    name: "Tyler Morrison",
    gradYear: 2023,
    title: "Analytics Coordinator",
    company: "Big East Conference",
    sports: ["College"],
    expertise: ["Tableau", "Data Visualization", "Web Scraping"],
    previousRoles: ["Student Manager, Bryant Men's Basketball"],
    tenure: "1 year at Big East Conference",
    availableForMentorship: false,
    employerType: "League",
  },
  {
    id: "priya-patel",
    name: "Priya Patel",
    gradYear: 2020,
    title: "Player Personnel Analyst",
    company: "LA Galaxy (MLS)",
    sports: ["MLS"],
    expertise: ["Scouting Models", "xG", "Video Analysis", "SQL"],
    previousRoles: ["Analytics Intern, New England Revolution", "RA, Bryant Data Science Lab"],
    tenure: "3 years at LA Galaxy",
    availableForMentorship: true,
    employerType: "Team",
  },
  {
    id: "david-kim",
    name: "David Kim",
    gradYear: 2022,
    title: "Sports Data Engineer",
    company: "Sportradar",
    sports: ["NFL", "NBA", "MLB"],
    expertise: ["Data Pipelines", "AWS", "dbt", "Python", "SQL"],
    previousRoles: ["Data Engineering Intern, Sportradar"],
    tenure: "2 years at Sportradar",
    availableForMentorship: false,
    employerType: "Tech",
  },
  {
    id: "rachel-foster",
    name: "Rachel Foster",
    gradYear: 2021,
    title: "Scouting Analyst",
    company: "Minnesota Timberwolves (NBA)",
    sports: ["NBA"],
    expertise: ["Draft Modeling", "Clustering", "R", "Synergy"],
    previousRoles: ["Video Coordinator, Bryant Women's Basketball"],
    tenure: "2 years at Minnesota Timberwolves",
    availableForMentorship: true,
    employerType: "Team",
  },
];

const SPORT_OPTIONS = [
  { value: "", label: "All Sports" },
  { value: "NFL", label: "NFL" },
  { value: "NBA", label: "NBA" },
  { value: "MLB", label: "MLB" },
  { value: "MLS", label: "MLS" },
  { value: "College", label: "College" },
];

const EMPLOYER_TYPE_OPTIONS = [
  { value: "", label: "All Employer Types" },
  { value: "Team", label: "Team" },
  { value: "League", label: "League" },
  { value: "Agency", label: "Agency" },
  { value: "Media", label: "Media" },
  { value: "Betting/DFS", label: "Betting/DFS" },
  { value: "Tech", label: "Tech" },
];

const GRAD_YEAR_OPTIONS = [
  { value: "", label: "All Years" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
  { value: "2021", label: "2021" },
  { value: "2020", label: "2020" },
  { value: "2019", label: "2019" },
];

export default function AlumniPage() {
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("");
  const [employerTypeFilter, setEmployerTypeFilter] = useState("");
  const [gradYearFilter, setGradYearFilter] = useState("");

  const featuredAlumni = MOCK_ALUMNI.find((a) => a.featured);

  const filtered = useMemo(() => {
    return MOCK_ALUMNI.filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.company.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.expertise.some((e) => e.toLowerCase().includes(q));

      const matchesSport = !sportFilter || a.sports.includes(sportFilter);
      const matchesEmployer = !employerTypeFilter || a.employerType === employerTypeFilter;
      const matchesYear = !gradYearFilter || a.gradYear.toString() === gradYearFilter;

      return matchesSearch && matchesSport && matchesEmployer && matchesYear;
    });
  }, [search, sportFilter, employerTypeFilter, gradYearFilter]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-bryant-gray-900">Alumni Directory</h1>

      {/* Featured Alumni Spotlight */}
      {featuredAlumni && (
        <Card className="bg-gradient-to-r from-bryant-black to-bryant-gray-800">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar name={featuredAlumni.name} size="xl" />
              <div className="flex-1 text-center md:text-left">
                <Badge variant="warning" className="mb-2">Featured Alumni</Badge>
                <h2 className="text-xl font-bold text-white">{featuredAlumni.name} &apos;{featuredAlumni.gradYear.toString().slice(-2)}</h2>
                <p className="text-bryant-gold font-medium">{featuredAlumni.title} at {featuredAlumni.company}</p>
                {featuredAlumni.quote && (
                  <div className="mt-3 flex items-start gap-2">
                    <Quote className="h-5 w-5 text-bryant-gold shrink-0 mt-0.5" />
                    <p className="text-bryant-gray-300 italic text-sm">{featuredAlumni.quote}</p>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-1 justify-center md:justify-start">
                  {featuredAlumni.expertise.map((tag) => (
                    <Badge key={tag} variant="tool">{tag}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="primary">
                  <UserPlus className="h-4 w-4" />
                  Connect
                </Button>
                <Button variant="outline" className="border-bryant-gray-600 text-white hover:bg-bryant-gray-700">
                  <ExternalLink className="h-4 w-4" />
                  View Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bryant-gray-400" />
              <input
                type="text"
                placeholder="Search alumni by name, company, or skill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full rounded-lg border border-bryant-gray-300 py-2 pl-9 pr-3 text-sm text-bryant-gray-900 placeholder:text-bryant-gray-400 focus:border-bryant-gold focus:outline-none focus:ring-2 focus:ring-bryant-gold focus:ring-offset-0 transition-colors"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Select
                options={SPORT_OPTIONS}
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
              />
              <Select
                options={EMPLOYER_TYPE_OPTIONS}
                value={employerTypeFilter}
                onChange={(e) => setEmployerTypeFilter(e.target.value)}
              />
              <Select
                options={GRAD_YEAR_OPTIONS}
                value={gradYearFilter}
                onChange={(e) => setGradYearFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alumni Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-12 w-12" />}
          title="No alumni found"
          description="Try adjusting your search or filters to find alumni."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setSportFilter("");
                setEmployerTypeFilter("");
                setGradYearFilter("");
              }}
            >
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((alumni) => (
            <Card key={alumni.id} className="flex flex-col hover:shadow-md transition-shadow">
              <CardContent className="flex-1 space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar name={alumni.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-bryant-gray-900 truncate">{alumni.name}</h3>
                      <Badge variant="default">&apos;{alumni.gradYear.toString().slice(-2)}</Badge>
                    </div>
                    <p className="text-sm font-bold text-bryant-gray-800">{alumni.title}</p>
                    <p className="text-sm text-bryant-gray-600">{alumni.company}</p>
                  </div>
                </div>

                {alumni.availableForMentorship && (
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-green-700">Available for Mentorship</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {alumni.sports.map((sport) => (
                    <Badge key={sport} variant="sport">{sport}</Badge>
                  ))}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm text-bryant-gray-600">
                    <Briefcase className="h-3.5 w-3.5 shrink-0" />
                    <span>{alumni.tenure}</span>
                  </div>
                  {alumni.previousRoles.map((role) => (
                    <div key={role} className="flex items-center gap-1.5 text-xs text-bryant-gray-500 pl-5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span>{role}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1">
                  {alumni.expertise.map((tag) => (
                    <Badge key={tag} variant="technique">{tag}</Badge>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button variant="primary" size="sm" className="flex-1">
                  <UserPlus className="h-3.5 w-3.5" />
                  Connect
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Profile
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
