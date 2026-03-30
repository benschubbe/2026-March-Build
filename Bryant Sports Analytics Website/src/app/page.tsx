import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  BarChart3,
  Users,
  Trophy,
  FolderOpen,
  MessageSquare,
  Briefcase,
  Rocket,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

const stats = [
  { value: "150+", label: "Projects Published", icon: FolderOpen },
  { value: "45", label: "Alumni in Pro Sports", icon: Users },
  { value: "12", label: "Weekly Challenges Completed", icon: Trophy },
];

const featuredProjects = [
  {
    sport: "Basketball",
    title: "Predicting NBA Draft Outcomes Using College Performance Metrics",
    author: "Alex Chen",
    avatar: undefined,
    abstract:
      "A machine learning approach to forecasting NBA draft positions based on NCAA statistics, combining advanced metrics with historical draft data to build predictive models.",
    tools: ["Python", "scikit-learn", "Tableau"],
  },
  {
    sport: "Baseball",
    title: "Pitch Sequencing Analysis: Optimizing Strikeout Probability",
    author: "Sarah Mitchell",
    avatar: undefined,
    abstract:
      "An in-depth analysis of pitch sequencing strategies using Statcast data, exploring how pitch type, location, and velocity changes affect strikeout rates across MLB.",
    tools: ["R", "Shiny", "SQL"],
  },
  {
    sport: "Football",
    title: "Fourth Down Decision Making: A Game Theory Approach",
    author: "Marcus Johnson",
    avatar: undefined,
    abstract:
      "Applying game theory and expected points analysis to evaluate NFL fourth-down decisions, comparing coach tendencies against mathematically optimal strategies.",
    tools: ["Python", "pandas", "D3.js"],
  },
];

const steps = [
  {
    number: "1",
    title: "Build Your Portfolio",
    description:
      "Upload projects, tag your skills, and create a polished showcase of your analytics work.",
    icon: FolderOpen,
  },
  {
    number: "2",
    title: "Get Peer Feedback",
    description:
      "Share work with classmates and alumni. Receive reviews, comments, and suggestions to improve.",
    icon: MessageSquare,
  },
  {
    number: "3",
    title: "Connect with Alumni",
    description:
      "Network with Bryant alumni working in pro sports. Find mentors who can guide your career.",
    icon: Users,
  },
  {
    number: "4",
    title: "Land the Job",
    description:
      "Apply to sports analytics roles, prep for interviews, and launch your career in sports.",
    icon: Briefcase,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-bryant-black/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="h-1 w-8 rounded-full bg-bryant-gold" />
            <span className="text-lg font-bold text-white">
              Bryant <span className="text-bryant-gold">Analytics</span>
            </span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              Features
            </Link>
            <Link
              href="#projects"
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              Projects
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              How It Works
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-bryant-black to-bryant-gray-900 pt-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-bryant-gold blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-bryant-gold-light blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-32 text-center">
          {/* Gold accent bar */}
          <div className="mx-auto mb-8 h-1.5 w-24 rounded-full bg-gradient-to-r from-bryant-gold to-bryant-gold-light" />

          <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Bryant Sports{" "}
            <span className="bg-gradient-to-r from-bryant-gold to-bryant-gold-light bg-clip-text text-transparent">
              Analytics Hub
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60 sm:text-xl">
            Showcase your work. Sharpen your skills. Land your dream job in
            sports.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="min-w-[160px]">
                <Rocket className="h-5 w-5" />
                Get Started
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="outline" size="lg" className="min-w-[160px] border-white/20 text-white hover:bg-white/10">
                Explore Projects
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Decorative gold accent line */}
          <div className="mx-auto mt-20 h-px w-full max-w-lg bg-gradient-to-r from-transparent via-bryant-gold/50 to-transparent" />
        </div>
      </section>

      {/* Stats Section */}
      <section id="features" className="relative -mt-12 px-6">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="text-center shadow-lg">
                <CardContent className="py-8">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bryant-gold/10">
                    <Icon className="h-6 w-6 text-bryant-gold" />
                  </div>
                  <p className="text-4xl font-bold text-bryant-gray-900">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-bryant-gray-500">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Featured Projects Section */}
      <section id="projects" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-bryant-gray-900">
              Featured Projects
            </h2>
            <p className="mt-3 text-bryant-gray-500">
              See what Bryant students are building
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {featuredProjects.map((project) => (
              <Card
                key={project.title}
                className="transition-shadow hover:shadow-lg"
              >
                <CardContent className="py-6">
                  <Badge variant="sport" className="mb-4">
                    {project.sport}
                  </Badge>
                  <h3 className="mb-3 text-lg font-semibold text-bryant-gray-900 leading-snug">
                    {project.title}
                  </h3>
                  <div className="mb-4 flex items-center gap-2">
                    <Avatar name={project.author} size="sm" />
                    <span className="text-sm text-bryant-gray-600">
                      {project.author}
                    </span>
                  </div>
                  <p className="mb-4 line-clamp-3 text-sm text-bryant-gray-500">
                    {project.abstract}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.tools.map((tool) => (
                      <Badge key={tool} variant="tool">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-sm font-medium text-bryant-gold transition-colors hover:text-bryant-gold-light"
            >
              View All Projects
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="bg-bryant-gray-50 px-6 py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-bryant-gray-900">
              How It Works
            </h2>
            <p className="mt-3 text-bryant-gray-500">
              From classroom to career in four steps
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-bryant-gold/10">
                    <Icon className="h-8 w-8 text-bryant-gold" />
                  </div>
                  <div className="mb-2 text-sm font-bold text-bryant-gold">
                    Step {step.number}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-bryant-gray-900">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-bryant-gray-500">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-b from-bryant-black to-bryant-gray-900 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <BarChart3 className="mx-auto mb-6 h-12 w-12 text-bryant-gold" />
          <h2 className="text-3xl font-bold text-white">
            Ready to showcase your work?
          </h2>
          <p className="mt-4 text-lg text-white/60">
            Join the Bryant Sports Analytics community and start building your
            professional portfolio today.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button size="lg">Create Your Account</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-bryant-black px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-3">
            {/* Brand */}
            <div>
              <div className="mb-3 h-1 w-8 rounded-full bg-bryant-gold" />
              <h3 className="text-lg font-bold text-white">
                Bryant Sports{" "}
                <span className="text-bryant-gold">Analytics Hub</span>
              </h3>
              <p className="mt-2 text-sm text-white/40">
                Built by the Bryant University Sports Analytics Club.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/40">
                Quick Links
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/projects"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    Projects
                  </Link>
                </li>
                <li>
                  <Link
                    href="/challenges"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    Challenges
                  </Link>
                </li>
                <li>
                  <Link
                    href="/jobs"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    Job Board
                  </Link>
                </li>
                <li>
                  <Link
                    href="/alumni"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    Alumni Network
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/40">
                Resources
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/tutorials"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    Tutorials
                  </Link>
                </li>
                <li>
                  <Link
                    href="/learning"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    Learning Paths
                  </Link>
                </li>
                <li>
                  <Link
                    href="/mentorship"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    Mentorship
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6">
            <p className="text-center text-xs text-white/30">
              &copy; {new Date().getFullYear()} Bryant University Sports
              Analytics Club. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
