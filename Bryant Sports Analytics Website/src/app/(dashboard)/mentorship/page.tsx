"use client";

import React, { useState } from "react";
import { Users, CheckCircle2, Clock, MessageSquare, CalendarDays, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Select } from "@/components/ui/select";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/tabs";
import { timeAgo } from "@/lib/utils";

interface Mentor {
  id: string;
  name: string;
  title: string;
  company: string;
  sports: string[];
  matchScore: number;
  availability: string;
  careerArea: string;
}

interface ActiveMentorship {
  id: string;
  mentorName: string;
  mentorTitle: string;
  mentorCompany: string;
  status: "Active" | "Pending";
  cadence: string;
  lastInteraction: string;
}

const HELP_TOPICS = [
  "Portfolio Review",
  "Interview Prep",
  "Career Guidance",
  "Technical Skills",
  "Networking",
];

const SPORT_OPTIONS = [
  { value: "", label: "Select a sport" },
  { value: "NBA", label: "Basketball (NBA)" },
  { value: "NFL", label: "Football (NFL)" },
  { value: "MLB", label: "Baseball (MLB)" },
  { value: "MLS", label: "Soccer (MLS)" },
  { value: "NHL", label: "Hockey (NHL)" },
  { value: "College", label: "College Athletics" },
];

const CAREER_OPTIONS = [
  { value: "", label: "Select a career area" },
  { value: "Player Analytics", label: "Player Analytics" },
  { value: "Data Engineering", label: "Data Engineering" },
  { value: "Scouting", label: "Scouting" },
  { value: "Media", label: "Media" },
  { value: "Betting", label: "Betting / DFS" },
  { value: "Front Office", label: "Front Office" },
];

const SUGGESTED_MENTORS: Mentor[] = [
  {
    id: "sarah-chen",
    name: "Sarah Chen",
    title: "Data Analyst",
    company: "Boston Celtics",
    sports: ["NBA"],
    matchScore: 95,
    availability: "Monthly",
    careerArea: "Player Analytics",
  },
  {
    id: "rachel-foster",
    name: "Rachel Foster",
    title: "Scouting Analyst",
    company: "Minnesota Timberwolves",
    sports: ["NBA"],
    matchScore: 88,
    availability: "Ad Hoc",
    careerArea: "Scouting",
  },
  {
    id: "james-park",
    name: "James Park",
    title: "Senior Data Scientist",
    company: "ESPN",
    sports: ["NBA", "NFL"],
    matchScore: 82,
    availability: "Async",
    careerArea: "Media",
  },
  {
    id: "aisha-johnson",
    name: "Aisha Johnson",
    title: "Quantitative Analyst",
    company: "DraftKings",
    sports: ["NFL", "NBA"],
    matchScore: 76,
    availability: "Monthly",
    careerArea: "Betting",
  },
  {
    id: "priya-patel",
    name: "Priya Patel",
    title: "Player Personnel Analyst",
    company: "LA Galaxy",
    sports: ["MLS"],
    matchScore: 70,
    availability: "Ad Hoc",
    careerArea: "Player Analytics",
  },
];

const ACTIVE_MENTORSHIPS: ActiveMentorship[] = [
  {
    id: "m1",
    mentorName: "Marcus Williams",
    mentorTitle: "Baseball Operations Analyst",
    mentorCompany: "Tampa Bay Rays",
    status: "Active",
    cadence: "Bi-weekly",
    lastInteraction: "2026-03-22",
  },
  {
    id: "m2",
    mentorName: "Priya Patel",
    mentorTitle: "Player Personnel Analyst",
    mentorCompany: "LA Galaxy",
    status: "Pending",
    cadence: "Monthly",
    lastInteraction: "2026-03-10",
  },
];

export default function MentorshipPage() {
  const [activeTab, setActiveTab] = useState("find");
  const [sportInterest, setSportInterest] = useState("");
  const [careerArea, setCareerArea] = useState("");
  const [helpTopics, setHelpTopics] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const toggleHelpTopic = (topic: string) => {
    setHelpTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleFindMatches = () => {
    setShowResults(true);
  };

  const filteredMentors = showResults
    ? SUGGESTED_MENTORS.filter((m) => {
        if (sportInterest && !m.sports.includes(sportInterest)) return false;
        if (careerArea && m.careerArea !== careerArea) return false;
        return true;
      }).slice(0, 5)
    : [];

  // If no filters narrow it down, show all
  const displayMentors = filteredMentors.length > 0 ? filteredMentors : showResults ? SUGGESTED_MENTORS.slice(0, 3) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-bryant-gray-900">Mentorship Matching</h1>

      <Tabs activeTab={activeTab} onTabChange={setActiveTab}>
        <TabList>
          <Tab value="find">Find a Mentor</Tab>
          <Tab value="my">My Mentorships</Tab>
        </TabList>

        {/* Find a Mentor */}
        <TabPanel value="find">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-bryant-gray-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-bryant-gold" />
                  Tell us about your interests
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="What sport interests you?"
                    options={SPORT_OPTIONS}
                    value={sportInterest}
                    onChange={(e) => setSportInterest(e.target.value)}
                    placeholder="Select a sport"
                  />
                  <Select
                    label="What career area?"
                    options={CAREER_OPTIONS}
                    value={careerArea}
                    onChange={(e) => setCareerArea(e.target.value)}
                    placeholder="Select a career area"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-bryant-gray-700">
                    What do you need help with?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {HELP_TOPICS.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => toggleHelpTopic(topic)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors border ${
                          helpTopics.includes(topic)
                            ? "bg-bryant-gold text-white border-bryant-gold"
                            : "bg-white text-bryant-gray-700 border-bryant-gray-300 hover:bg-bryant-gray-50"
                        }`}
                      >
                        {helpTopics.includes(topic) && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <Button variant="primary" onClick={handleFindMatches}>
                  <Users className="h-4 w-4" />
                  Find Matches
                </Button>
              </CardContent>
            </Card>

            {/* Suggested Mentors */}
            {showResults && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-bryant-gray-900">
                  Suggested Mentors ({displayMentors.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayMentors.map((mentor) => (
                    <Card key={mentor.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Avatar name={mentor.name} size="lg" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-bryant-gray-900">{mentor.name}</h4>
                            <p className="text-sm text-bryant-gray-700">{mentor.title}</p>
                            <p className="text-sm text-bryant-gray-500">{mentor.company}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {mentor.sports.map((s) => (
                            <Badge key={s} variant="sport">{s}</Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1.5">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-xs font-bold text-green-700">{mentor.matchScore}%</span>
                            </div>
                            <span className="text-bryant-gray-600">Match</span>
                          </div>
                          <div className="flex items-center gap-1 text-bryant-gray-500">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{mentor.availability}</span>
                          </div>
                        </div>

                        <Button variant="primary" size="sm" className="w-full">
                          Request Mentorship
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabPanel>

        {/* My Mentorships */}
        <TabPanel value="my">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-bryant-gray-900">Active Mentorships</h3>
            {ACTIVE_MENTORSHIPS.map((m) => (
              <Card key={m.id} className="hover:shadow-md transition-shadow">
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar name={m.mentorName} size="lg" />
                      <div>
                        <h4 className="font-semibold text-bryant-gray-900">{m.mentorName}</h4>
                        <p className="text-sm text-bryant-gray-600">{m.mentorTitle} at {m.mentorCompany}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge
                            variant={m.status === "Active" ? "success" : "warning"}
                          >
                            {m.status}
                          </Badge>
                          <span className="text-xs text-bryant-gray-500">
                            {m.cadence} check-ins
                          </span>
                          <span className="text-xs text-bryant-gray-400">
                            Last: {timeAgo(m.lastInteraction)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Schedule Check-in
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
}
