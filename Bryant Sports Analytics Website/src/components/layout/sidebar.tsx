"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FolderOpen,
  Layers,
  Search,
  MessageSquare,
  Hash,
  Mail,
  Star,
  Briefcase,
  ClipboardList,
  FileText,
  HelpCircle,
  Map,
  Trophy,
  BookOpen,
  Award,
  Users,
  UserPlus,
  Calendar,
  Settings,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "SHOWCASE",
    items: [
      { label: "My Analytics", href: "/my-analytics", icon: BarChart3 },
      { label: "Portfolio", href: "/portfolio", icon: FolderOpen },
      { label: "My Projects", href: "/projects", icon: Layers },
      { label: "Gallery", href: "/gallery", icon: Search },
    ],
  },
  {
    title: "COMMUNITY",
    items: [
      { label: "Feed", href: "/feed", icon: MessageSquare },
      { label: "Channels", href: "/channels", icon: Hash },
      { label: "Messages", href: "/messages", icon: Mail },
      { label: "Peer Reviews", href: "/reviews", icon: Star },
    ],
  },
  {
    title: "CAREER",
    items: [
      { label: "Job Board", href: "/jobs", icon: Briefcase },
      { label: "Applications", href: "/applications", icon: ClipboardList },
      { label: "Resume Builder", href: "/resume", icon: FileText },
      { label: "Interview Prep", href: "/interview-prep", icon: HelpCircle },
    ],
  },
  {
    title: "GROWTH",
    items: [
      { label: "Learning Paths", href: "/learning", icon: Map },
      { label: "Challenges", href: "/challenges", icon: Trophy },
      { label: "Tutorials", href: "/tutorials", icon: BookOpen },
      { label: "Certifications", href: "/certifications", icon: Award },
    ],
  },
  {
    title: "NETWORK",
    items: [
      { label: "Alumni Directory", href: "/alumni", icon: Users },
      { label: "Mentorship", href: "/mentorship", icon: UserPlus },
      { label: "Events", href: "/events", icon: Calendar },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-bryant-black text-white">
      {/* Logo / Wordmark */}
      <div className="px-6 pt-6 pb-4">
        <div className="mb-2 h-1 w-10 rounded-full bg-bryant-gold" />
        <h1 className="text-lg font-bold tracking-tight">
          Bryant Sports
          <br />
          <span className="text-bryant-gold">Analytics Hub</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="mb-1 px-4 text-[11px] font-semibold tracking-widest text-white/40">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-4 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-bryant-gold/20 text-bryant-gold"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom: User + Settings */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bryant-gold/20 text-sm font-semibold text-bryant-gold">
            BS
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Ben Schubbe</p>
            <span className="inline-block rounded-full bg-bryant-gold/10 px-2 py-0.5 text-[10px] font-medium text-bryant-gold">
              Analyst
            </span>
          </div>
          <Link
            href="/settings"
            className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
