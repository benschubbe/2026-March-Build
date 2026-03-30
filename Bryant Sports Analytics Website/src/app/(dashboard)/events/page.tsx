"use client";

import React, { useState, useMemo } from "react";
import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  Mic2,
  Handshake,
  GraduationCap,
  Code2,
  Tv,
  UsersRound,
  CalendarPlus,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { truncate } from "@/lib/utils";

type EventType = "Speaker" | "Mixer" | "Career Fair" | "Workshop" | "Watch Party" | "Meeting";

interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;
  time: string;
  location: string;
  description: string;
  attendeeCount: number;
  attendeeNames: string[];
}

const eventTypeConfig: Record<EventType, { color: string; icon: React.ReactNode }> = {
  Speaker: { color: "bg-purple-100 text-purple-800", icon: <Mic2 className="h-3.5 w-3.5" /> },
  Mixer: { color: "bg-pink-100 text-pink-800", icon: <Handshake className="h-3.5 w-3.5" /> },
  "Career Fair": { color: "bg-blue-100 text-blue-800", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  Workshop: { color: "bg-green-100 text-green-800", icon: <Code2 className="h-3.5 w-3.5" /> },
  "Watch Party": { color: "bg-amber-100 text-amber-800", icon: <Tv className="h-3.5 w-3.5" /> },
  Meeting: { color: "bg-bryant-gray-100 text-bryant-gray-800", icon: <UsersRound className="h-3.5 w-3.5" /> },
};

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "e1",
    title: "Sports Analytics Club Meeting",
    type: "Meeting",
    date: "2026-04-03",
    time: "5:00 PM",
    location: "Room 301",
    description: "Weekly club meeting to discuss ongoing projects, upcoming events, and guest speaker logistics. All members welcome.",
    attendeeCount: 22,
    attendeeNames: ["Ben Schubbe", "Tyler Morrison", "Jake Thompson"],
  },
  {
    id: "e2",
    title: "Guest Speaker: Sarah Chen on NBA Analytics",
    type: "Speaker",
    date: "2026-04-05",
    time: "6:00 PM",
    location: "Bryant Analytics Lab",
    description: "Join Sarah Chen '21, Data Analyst with the Boston Celtics, as she shares how Bryant prepared her for a career in NBA analytics. Q&A session to follow.",
    attendeeCount: 45,
    attendeeNames: ["Sarah Chen", "Ben Schubbe", "Marcus Williams", "Rachel Foster"],
  },
  {
    id: "e3",
    title: "Python Workshop: Web Scraping Sports Data",
    type: "Workshop",
    date: "2026-04-08",
    time: "4:00 PM",
    location: "Room 245",
    description: "Hands-on workshop covering BeautifulSoup, Selenium, and API calls for collecting sports data from Basketball Reference, FBref, and Statcast. Bring your laptop!",
    attendeeCount: 30,
    attendeeNames: ["David Kim", "Sofia Nguyen", "Ben Schubbe"],
  },
  {
    id: "e4",
    title: "Spring Career Fair",
    type: "Career Fair",
    date: "2026-04-12",
    time: "10:00 AM - 3:00 PM",
    location: "Bello Center",
    description: "Annual career fair featuring sports teams, media companies, and analytics firms. Confirmed attendees include the Celtics, ESPN, DraftKings, and Sportradar. Business casual dress required.",
    attendeeCount: 120,
    attendeeNames: ["Ben Schubbe", "Aisha Johnson", "James Park", "Emily Rodriguez"],
  },
  {
    id: "e5",
    title: "SSAC Watch Party",
    type: "Watch Party",
    date: "2026-04-15",
    time: "7:00 PM",
    location: "Virtual (Zoom)",
    description: "Watch the MIT Sloan Sports Analytics Conference keynote and research presentations together as a club. Discussion and trivia to follow.",
    attendeeCount: 35,
    attendeeNames: ["Marcus Williams", "Priya Patel", "Ben Schubbe"],
  },
  {
    id: "e6",
    title: "Mock Interview Night",
    type: "Workshop",
    date: "2026-04-18",
    time: "5:30 PM",
    location: "Career Center",
    description: "Practice your sports analytics interview skills with alumni mentors. Covers technical questions, case studies, and behavioral interviews. Sign up for a 30-minute slot.",
    attendeeCount: 18,
    attendeeNames: ["James Park", "Sarah Chen", "Ben Schubbe"],
  },
  {
    id: "e7",
    title: "Alumni Networking Mixer",
    type: "Mixer",
    date: "2026-04-20",
    time: "6:00 PM",
    location: "Providence, RI",
    description: "Casual networking event with Bryant sports analytics alumni working across the industry. Food and drinks provided. Great opportunity to make connections.",
    attendeeCount: 40,
    attendeeNames: ["Sarah Chen", "Marcus Williams", "Emily Rodriguez", "Aisha Johnson"],
  },
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function EventsPage() {
  const [rsvpSet, setRsvpSet] = useState<Set<string>>(new Set());

  // Show April 2026 since that's when our events are
  const calendarYear = 2026;
  const calendarMonth = 3; // April (0-indexed)

  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);

  const eventsByDate = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    MOCK_EVENTS.forEach((ev) => {
      const d = new Date(ev.date);
      if (d.getFullYear() === calendarYear && d.getMonth() === calendarMonth) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(ev);
      }
    });
    return map;
  }, []);

  const sortedEvents = useMemo(() => {
    return [...MOCK_EVENTS].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, []);

  const toggleRsvp = (eventId: string) => {
    setRsvpSet((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-bryant-gray-900">Events</h1>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="py-4">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-bryant-gray-900">
              {MONTH_NAMES[calendarMonth]} {calendarYear}
            </h2>
          </div>
          <div className="grid grid-cols-7 gap-px bg-bryant-gray-200 rounded-lg overflow-hidden">
            {DAY_NAMES.map((day) => (
              <div
                key={day}
                className="bg-bryant-gray-50 p-2 text-center text-xs font-medium text-bryant-gray-500"
              >
                {day}
              </div>
            ))}
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-white p-2 min-h-[60px]" />
            ))}
            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = eventsByDate[day] || [];
              return (
                <div
                  key={day}
                  className="bg-white p-2 min-h-[60px] text-sm"
                >
                  <span className="text-bryant-gray-700">{day}</span>
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {dayEvents.map((ev) => {
                      const config = eventTypeConfig[ev.type];
                      return (
                        <span
                          key={ev.id}
                          className={`block h-2 w-2 rounded-full ${config.color.split(" ")[0].replace("bg-", "bg-")}`}
                          title={ev.title}
                          style={{
                            backgroundColor:
                              ev.type === "Speaker" ? "#9333ea" :
                              ev.type === "Mixer" ? "#ec4899" :
                              ev.type === "Career Fair" ? "#3b82f6" :
                              ev.type === "Workshop" ? "#22c55e" :
                              ev.type === "Watch Party" ? "#f59e0b" :
                              "#6b7280",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-bryant-gray-900">Upcoming Events</h2>
        {sortedEvents.map((event) => {
          const config = eventTypeConfig[event.type];
          const isAttending = rsvpSet.has(event.id);
          const dateObj = new Date(event.date);
          const formattedDate = dateObj.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });

          return (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Date Block */}
                  <div className="flex md:flex-col items-center justify-center md:w-20 shrink-0 text-center">
                    <span className="text-2xl font-bold text-bryant-gold">{dateObj.getDate()}</span>
                    <span className="text-sm text-bryant-gray-500 ml-1 md:ml-0">
                      {dateObj.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
                      >
                        {config.icon}
                        {event.type}
                      </span>
                      <h3 className="font-semibold text-bryant-gray-900">{event.title}</h3>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-bryant-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formattedDate}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {event.time}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.location}
                      </span>
                    </div>

                    <p className="text-sm text-bryant-gray-600">
                      {truncate(event.description, 180)}
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        {/* Avatar stack */}
                        <div className="flex -space-x-2">
                          {event.attendeeNames.slice(0, 4).map((name) => (
                            <Avatar key={name} name={name} size="sm" className="ring-2 ring-white" />
                          ))}
                        </div>
                        <span className="text-sm text-bryant-gray-500 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {event.attendeeCount} attending
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button className="text-sm text-bryant-gray-500 hover:text-bryant-gold transition-colors flex items-center gap-1">
                          <CalendarPlus className="h-3.5 w-3.5" />
                          Add to Calendar
                        </button>
                        <Button
                          variant={isAttending ? "secondary" : "primary"}
                          size="sm"
                          onClick={() => toggleRsvp(event.id)}
                        >
                          {isAttending ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Attending
                            </>
                          ) : (
                            "RSVP"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
