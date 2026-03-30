"use client";

import React, { useState } from "react";
import {
  Plus,
  StickyNote,
  Calendar,
  ChevronRight,
  Briefcase,
  TrendingUp,
  Trophy,
  Target,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";

/* ---------- types ---------- */

type StatusColumn =
  | "interested"
  | "applied"
  | "phone_screen"
  | "interview"
  | "offer"
  | "accepted"
  | "rejected";

interface TimelineEntry {
  status: string;
  date: string;
}

interface Application {
  id: string;
  title: string;
  company: string;
  companyColor: string;
  url: string;
  status: StatusColumn;
  dateAdded: string;
  followUpDate?: string;
  notes: string[];
  contacts: string;
  timeline: TimelineEntry[];
}

/* ---------- mock data ---------- */

const INITIAL_APPS: Application[] = [
  {
    id: "1",
    title: "Basketball Analytics Intern",
    company: "Boston Celtics",
    companyColor: "bg-green-600",
    url: "https://celtics.com/careers",
    status: "interview",
    dateAdded: "2026-02-15",
    followUpDate: "2026-04-02",
    notes: [
      "Spoke with hiring manager - they want SQL and Python skills",
      "Prepare Celtics shot chart project for discussion",
    ],
    contacts: "Sarah Chen - HR, sarah.chen@celtics.com",
    timeline: [
      { status: "Interested", date: "2026-02-15" },
      { status: "Applied", date: "2026-02-18" },
      { status: "Phone Screen", date: "2026-03-05" },
      { status: "Interview", date: "2026-03-20" },
    ],
  },
  {
    id: "2",
    title: "Data Visualization Specialist",
    company: "ESPN",
    companyColor: "bg-red-600",
    url: "https://espn.com/careers",
    status: "applied",
    dateAdded: "2026-03-01",
    notes: ["Submitted portfolio link with NBA shot charts"],
    contacts: "",
    timeline: [
      { status: "Interested", date: "2026-02-28" },
      { status: "Applied", date: "2026-03-01" },
    ],
  },
  {
    id: "3",
    title: "Sports Modeler",
    company: "DraftKings",
    companyColor: "bg-emerald-600",
    url: "https://draftkings.com/careers",
    status: "phone_screen",
    dateAdded: "2026-02-20",
    followUpDate: "2026-03-31",
    notes: [
      "Phone screen scheduled for 3/31",
      "Review probability and Bayesian stats",
    ],
    contacts: "Mike Torres - Recruiting, mtorres@draftkings.com",
    timeline: [
      { status: "Interested", date: "2026-02-20" },
      { status: "Applied", date: "2026-02-22" },
      { status: "Phone Screen", date: "2026-03-15" },
    ],
  },
  {
    id: "4",
    title: "Quantitative Analyst",
    company: "FanDuel",
    companyColor: "bg-blue-500",
    url: "https://fanduel.com/careers",
    status: "offer",
    dateAdded: "2026-01-10",
    notes: [
      "Offer received! $75K base + bonus",
      "Need to respond by April 5",
    ],
    contacts: "Lisa Park - Talent, lisa.park@fanduel.com",
    timeline: [
      { status: "Interested", date: "2026-01-10" },
      { status: "Applied", date: "2026-01-12" },
      { status: "Phone Screen", date: "2026-01-28" },
      { status: "Interview", date: "2026-02-15" },
      { status: "Offer", date: "2026-03-20" },
    ],
  },
  {
    id: "5",
    title: "Scouting Analyst",
    company: "New England Patriots",
    companyColor: "bg-blue-900",
    url: "https://patriots.com/careers",
    status: "interested",
    dateAdded: "2026-03-25",
    notes: [],
    contacts: "",
    timeline: [{ status: "Interested", date: "2026-03-25" }],
  },
  {
    id: "6",
    title: "Performance Analyst",
    company: "New England Revolution",
    companyColor: "bg-blue-800",
    url: "https://revolutionsoccer.net/careers",
    status: "interested",
    dateAdded: "2026-03-27",
    notes: ["Check if they use StatsBomb or Opta data"],
    contacts: "",
    timeline: [{ status: "Interested", date: "2026-03-27" }],
  },
  {
    id: "7",
    title: "Athletic Performance Coordinator",
    company: "Bryant University",
    companyColor: "bg-bryant-gold",
    url: "https://bryant.edu/careers",
    status: "interview",
    dateAdded: "2026-02-01",
    followUpDate: "2026-04-01",
    notes: [
      "On-campus interview with AD and coaching staff",
      "Bring Catapult data analysis samples",
    ],
    contacts: "Coach Williams - Athletics Dept",
    timeline: [
      { status: "Interested", date: "2026-02-01" },
      { status: "Applied", date: "2026-02-03" },
      { status: "Phone Screen", date: "2026-02-18" },
      { status: "Interview", date: "2026-03-10" },
    ],
  },
  {
    id: "8",
    title: "R&D Data Scientist",
    company: "Los Angeles Dodgers",
    companyColor: "bg-blue-700",
    url: "https://dodgers.com/careers",
    status: "rejected",
    dateAdded: "2026-01-05",
    notes: ["Received rejection - they wanted 3+ years experience"],
    contacts: "",
    timeline: [
      { status: "Interested", date: "2026-01-05" },
      { status: "Applied", date: "2026-01-08" },
      { status: "Rejected", date: "2026-02-10" },
    ],
  },
];

const COLUMNS: { key: StatusColumn; label: string }[] = [
  { key: "interested", label: "Interested" },
  { key: "applied", label: "Applied" },
  { key: "phone_screen", label: "Phone Screen" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
];

const STATUS_OPTIONS = COLUMNS.map((c) => ({
  value: c.key,
  label: c.label,
}));

const statusBadgeVariant = (status: StatusColumn) => {
  const map: Record<StatusColumn, "default" | "sport" | "technique" | "tool" | "domain" | "success" | "warning" | "error"> = {
    interested: "default",
    applied: "sport",
    phone_screen: "technique",
    interview: "domain",
    offer: "success",
    accepted: "success",
    rejected: "error",
  };
  return map[status];
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>(INITIAL_APPS);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newApp, setNewApp] = useState({
    title: "",
    company: "",
    url: "",
    notes: "",
  });
  const [detailNotes, setDetailNotes] = useState("");
  const [detailContacts, setDetailContacts] = useState("");
  const [detailFollowUp, setDetailFollowUp] = useState("");
  const [detailStatus, setDetailStatus] = useState<StatusColumn>("interested");

  /* ---- computed stats ---- */
  const activeCount = apps.filter(
    (a) => a.status !== "rejected" && a.status !== "accepted"
  ).length;
  const interviewCount = apps.filter(
    (a) => a.status === "interview" || a.status === "phone_screen"
  ).length;
  const offerCount = apps.filter(
    (a) => a.status === "offer" || a.status === "accepted"
  ).length;

  /* ---- handlers ---- */
  function handleAddApp() {
    if (!newApp.title.trim() || !newApp.company.trim()) return;
    const app: Application = {
      id: Date.now().toString(),
      title: newApp.title,
      company: newApp.company,
      companyColor: "bg-bryant-gray-600",
      url: newApp.url,
      status: "interested",
      dateAdded: new Date().toISOString().split("T")[0],
      notes: newApp.notes ? [newApp.notes] : [],
      contacts: "",
      timeline: [
        { status: "Interested", date: new Date().toISOString().split("T")[0] },
      ],
    };
    setApps((prev) => [...prev, app]);
    setNewApp({ title: "", company: "", url: "", notes: "" });
    setShowAddModal(false);
  }

  function openDetail(app: Application) {
    setSelectedApp(app);
    setDetailNotes("");
    setDetailContacts(app.contacts);
    setDetailFollowUp(app.followUpDate || "");
    setDetailStatus(app.status);
  }

  function saveDetail() {
    if (!selectedApp) return;
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== selectedApp.id) return a;
        const updated = { ...a };
        updated.contacts = detailContacts;
        updated.followUpDate = detailFollowUp || undefined;
        if (detailNotes.trim()) {
          updated.notes = [...a.notes, detailNotes.trim()];
        }
        if (detailStatus !== a.status) {
          updated.status = detailStatus;
          updated.timeline = [
            ...a.timeline,
            {
              status:
                COLUMNS.find((c) => c.key === detailStatus)?.label ||
                detailStatus,
              date: new Date().toISOString().split("T")[0],
            },
          ];
        }
        return updated;
      })
    );
    setSelectedApp(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bryant-gray-900">
            Application Tracker
          </h1>
          <p className="mt-1 text-sm text-bryant-gray-500">
            Track and manage your job applications in one place
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          Add Application
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-bryant-gray-900">
                {activeCount}
              </p>
              <p className="text-sm text-bryant-gray-500">
                Active Applications
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-bryant-gray-900">
                {interviewCount}
              </p>
              <p className="text-sm text-bryant-gray-500">
                Interviews Scheduled
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-bryant-gray-900">
                {offerCount}
              </p>
              <p className="text-sm text-bryant-gray-500">
                {offerCount === 1 ? "Offer Received" : "Offers Received"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colApps = apps.filter((a) => a.status === col.key);
          return (
            <div
              key={col.key}
              className="flex-shrink-0 w-64 bg-bryant-gray-50 rounded-xl p-3"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-bryant-gray-700">
                  {col.label}
                </h3>
                <Badge variant="default">{colApps.length}</Badge>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {colApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => openDetail(app)}
                    className="w-full text-left"
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start gap-2">
                          <div
                            className={`h-8 w-8 rounded ${app.companyColor} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}
                          >
                            {app.company[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-bryant-gray-500 truncate">
                              {app.company}
                            </p>
                            <p className="text-sm font-medium text-bryant-gray-900 truncate">
                              {app.title}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-bryant-gray-400">
                            {formatDate(app.dateAdded)}
                          </span>
                          <div className="flex items-center gap-1">
                            {app.followUpDate && (
                              <Calendar className="h-3 w-3 text-amber-500" />
                            )}
                            {app.notes.length > 0 && (
                              <span className="flex items-center text-xs text-bryant-gray-400">
                                <StickyNote className="h-3 w-3 mr-0.5" />
                                {app.notes.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Application Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Application"
      >
        <div className="space-y-4">
          <Input
            label="Job Title"
            placeholder="e.g. Data Analyst Intern"
            value={newApp.title}
            onChange={(e) =>
              setNewApp((p) => ({ ...p, title: e.target.value }))
            }
          />
          <Input
            label="Company"
            placeholder="e.g. Boston Celtics"
            value={newApp.company}
            onChange={(e) =>
              setNewApp((p) => ({ ...p, company: e.target.value }))
            }
          />
          <Input
            label="URL"
            placeholder="https://..."
            value={newApp.url}
            onChange={(e) =>
              setNewApp((p) => ({ ...p, url: e.target.value }))
            }
          />
          <Textarea
            label="Notes"
            placeholder="Any initial notes..."
            rows={3}
            value={newApp.notes}
            onChange={(e) =>
              setNewApp((p) => ({ ...p, notes: e.target.value }))
            }
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddApp}>Add Application</Button>
          </div>
        </div>
      </Modal>

      {/* Application Detail Modal */}
      <Modal
        open={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title={selectedApp ? `${selectedApp.title} - ${selectedApp.company}` : ""}
      >
        {selectedApp && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Status */}
            <div className="flex items-center gap-2">
              <Badge variant={statusBadgeVariant(selectedApp.status)}>
                {COLUMNS.find((c) => c.key === selectedApp.status)?.label}
              </Badge>
              {selectedApp.url && (
                <a
                  href={selectedApp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-bryant-gold hover:underline"
                >
                  View Posting
                </a>
              )}
            </div>

            {/* Status Change */}
            <Select
              label="Move to"
              options={STATUS_OPTIONS}
              value={detailStatus}
              onChange={(e) =>
                setDetailStatus(e.target.value as StatusColumn)
              }
            />

            {/* Contact */}
            <Input
              label="Contact Info"
              placeholder="Name, email, phone..."
              value={detailContacts}
              onChange={(e) => setDetailContacts(e.target.value)}
            />

            {/* Follow-up */}
            <Input
              label="Follow-up Date"
              type="date"
              value={detailFollowUp}
              onChange={(e) => setDetailFollowUp(e.target.value)}
            />

            {/* Existing Notes */}
            {selectedApp.notes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-bryant-gray-700 mb-2">
                  Notes
                </p>
                <div className="space-y-1">
                  {selectedApp.notes.map((note, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-bryant-gray-600 bg-bryant-gray-50 rounded-lg px-3 py-2"
                    >
                      <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 text-bryant-gray-400" />
                      {note}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Note */}
            <Textarea
              label="Add Note"
              placeholder="Write a new note..."
              rows={2}
              value={detailNotes}
              onChange={(e) => setDetailNotes(e.target.value)}
            />

            {/* Timeline */}
            <div>
              <p className="text-sm font-medium text-bryant-gray-700 mb-2">
                Timeline
              </p>
              <div className="relative pl-4 border-l-2 border-bryant-gray-200 space-y-3">
                {selectedApp.timeline.map((entry, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[calc(0.25rem+9px)] top-1 h-3 w-3 rounded-full bg-bryant-gold border-2 border-white" />
                    <p className="text-sm font-medium text-bryant-gray-800">
                      {entry.status}
                    </p>
                    <p className="text-xs text-bryant-gray-400">
                      {formatDate(entry.date)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-bryant-gray-200">
              <Button
                variant="outline"
                onClick={() => setSelectedApp(null)}
              >
                Cancel
              </Button>
              <Button onClick={saveDetail}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
