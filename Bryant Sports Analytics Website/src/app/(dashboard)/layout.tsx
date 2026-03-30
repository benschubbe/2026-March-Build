"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

const pageTitles: Record<string, string> = {
  "/portfolio": "Portfolio",
  "/projects": "My Projects",
  "/gallery": "Gallery",
  "/feed": "Feed",
  "/channels": "Channels",
  "/messages": "Messages",
  "/reviews": "Peer Reviews",
  "/jobs": "Job Board",
  "/applications": "Applications",
  "/resume": "Resume Builder",
  "/interview-prep": "Interview Prep",
  "/learning": "Learning Paths",
  "/challenges": "Challenges",
  "/tutorials": "Tutorials",
  "/certifications": "Certifications",
  "/alumni": "Alumni Directory",
  "/mentorship": "Mentorship",
  "/events": "Events",
  "/settings": "Settings",
  "/dashboard": "Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] || "Dashboard";

  return <AppShell pageTitle={pageTitle}>{children}</AppShell>;
}
