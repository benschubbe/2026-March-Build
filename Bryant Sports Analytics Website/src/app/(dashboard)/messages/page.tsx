"use client";

import React, { useState } from "react";
import { Search, Send, Circle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Message {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timeAgo: string;
  unread: boolean;
  online: boolean;
  messages: Message[];
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    name: "Sarah Mitchell",
    lastMessage: "I'll send over those Second Spectrum notebooks tonight",
    timeAgo: "12m ago",
    unread: true,
    online: true,
    messages: [
      { id: "m1", from: "them", text: "Hey Ben! Saw your post about the NBA injury prediction project. Really cool approach with the time series fatigue modeling.", time: "3:15 PM" },
      { id: "m2", from: "me", text: "Thanks Sarah! I've been struggling with the Second Spectrum data format though. The JSON schema is pretty nested.", time: "3:18 PM" },
      { id: "m3", from: "them", text: "Yeah it can be tricky. We had the same issue when we started at the Celtics. I have some starter notebooks that parse the tracking data into tidy dataframes.", time: "3:22 PM" },
      { id: "m4", from: "me", text: "That would be incredibly helpful! Would you mind sharing them?", time: "3:24 PM" },
      { id: "m5", from: "them", text: "Of course! They're non-proprietary -- we use them for onboarding interns. I'll clean them up a bit first.", time: "3:28 PM" },
      { id: "m6", from: "me", text: "Amazing, no rush at all. Really appreciate it.", time: "3:30 PM" },
      { id: "m7", from: "them", text: "I'll send over those Second Spectrum notebooks tonight", time: "3:45 PM" },
    ],
  },
  {
    id: "2",
    name: "Marcus Chen",
    lastMessage: "Want to grab coffee and work on the EPA model together?",
    timeAgo: "1h ago",
    unread: true,
    online: true,
    messages: [
      { id: "m8", from: "them", text: "Hey, did you see Dr. Bahr's post about the Statcast spin rate article?", time: "1:00 PM" },
      { id: "m9", from: "me", text: "Yeah! Really interesting stuff. Are you thinking about incorporating pitch-level features into your EPA model?", time: "1:05 PM" },
      { id: "m10", from: "them", text: "Exactly. I think combining pitch-level Statcast data with play-by-play EPA could give us a much richer model.", time: "1:12 PM" },
      { id: "m11", from: "me", text: "That sounds like a solid approach. Have you figured out how to join the datasets? The pitch IDs don't always line up cleanly.", time: "1:15 PM" },
      { id: "m12", from: "them", text: "I've got a fuzzy matching script that works about 95% of the time. Still working on edge cases for mid-AB pitching changes.", time: "1:20 PM" },
      { id: "m13", from: "them", text: "Want to grab coffee and work on the EPA model together?", time: "1:25 PM" },
    ],
  },
  {
    id: "3",
    name: "Alyssa Rivera",
    lastMessage: "The DBSCAN results actually look way better, you were right",
    timeAgo: "3h ago",
    unread: false,
    online: false,
    messages: [
      { id: "m14", from: "them", text: "Hey Ben, thanks for the feedback on my NBA draft clustering project!", time: "10:00 AM" },
      { id: "m15", from: "me", text: "Of course! The K-means approach was solid. Have you tried DBSCAN like Dr. Bahr suggested? Might handle the outlier prospects better.", time: "10:10 AM" },
      { id: "m16", from: "them", text: "I actually just ran it last night. Setting the right epsilon was tricky but I used a k-distance graph to find the elbow.", time: "10:30 AM" },
      { id: "m17", from: "me", text: "Smart. How do the clusters compare to K-means?", time: "10:35 AM" },
      { id: "m18", from: "them", text: "Way fewer noisy assignments. The 'tweener' prospects that K-means was forcing into clusters are now properly flagged as outliers.", time: "10:42 AM" },
      { id: "m19", from: "me", text: "That's awesome. Those are probably the hardest prospects to evaluate anyway -- makes sense they don't fit cleanly.", time: "10:48 AM" },
      { id: "m20", from: "them", text: "Exactly. I'm updating the project page now.", time: "10:55 AM" },
      { id: "m21", from: "them", text: "The DBSCAN results actually look way better, you were right", time: "11:00 AM" },
    ],
  },
  {
    id: "4",
    name: "Dr. Kevin Bahr",
    lastMessage: "Looking forward to seeing your final presentation",
    timeAgo: "1d ago",
    unread: false,
    online: false,
    messages: [
      { id: "m22", from: "them", text: "Ben, great work on the March Madness bracket simulation you presented in class today.", time: "Yesterday" },
      { id: "m23", from: "me", text: "Thank you Dr. Bahr! I was nervous about the Monte Carlo methodology section but I think the simulation convergence plots helped explain it.", time: "Yesterday" },
      { id: "m24", from: "them", text: "They did. One suggestion -- consider adding a sensitivity analysis showing how the results change with different priors on upset probability.", time: "Yesterday" },
      { id: "m25", from: "me", text: "That's a great idea. I could show how bracket EV changes across a range of upset priors. Would make the Bayesian angle stronger.", time: "Yesterday" },
      { id: "m26", from: "them", text: "Exactly. Also, you might want to compare your model's picks against the consensus bracket to quantify the edge.", time: "Yesterday" },
      { id: "m27", from: "me", text: "Will do. I'll add that analysis before the final submission.", time: "Yesterday" },
      { id: "m28", from: "them", text: "Looking forward to seeing your final presentation", time: "Yesterday" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MessagesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");

  const filteredConversations = searchQuery.trim()
    ? MOCK_CONVERSATIONS.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : MOCK_CONVERSATIONS;

  const selected = MOCK_CONVERSATIONS.find((c) => c.id === selectedId) || null;

  return (
    <div className="flex h-[calc(100vh-10rem)] rounded-xl border border-bryant-gray-200 bg-white shadow-sm overflow-hidden">
      {/* ---- Left: conversation list ---- */}
      <div className="w-80 shrink-0 border-r border-bryant-gray-200 flex flex-col">
        {/* Search */}
        <div className="p-3 border-b border-bryant-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bryant-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-lg border border-bryant-gray-300 py-2 pl-9 pr-3 text-sm text-bryant-gray-900 placeholder:text-bryant-gray-400 focus:border-bryant-gold focus:outline-none focus:ring-2 focus:ring-bryant-gold focus:ring-offset-0 transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-bryant-gray-100 ${
                selectedId === conv.id
                  ? "bg-bryant-gold/5"
                  : "hover:bg-bryant-gray-50"
              }`}
            >
              <div className="relative shrink-0">
                <Avatar name={conv.name} size="md" />
                {conv.online && (
                  <Circle className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 fill-green-500 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-bryant-gray-900 truncate">
                    {conv.name}
                  </span>
                  <span className="text-xs text-bryant-gray-400 shrink-0 ml-2">
                    {conv.timeAgo}
                  </span>
                </div>
                <p className="text-xs text-bryant-gray-500 truncate mt-0.5">
                  {conv.lastMessage}
                </p>
              </div>
              {conv.unread && (
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-bryant-gold" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Right: message thread ---- */}
      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-bryant-gray-200">
              <Avatar name={selected.name} size="md" />
              <div>
                <p className="text-sm font-semibold text-bryant-gray-900">
                  {selected.name}
                </p>
                <p className="text-xs text-bryant-gray-500">
                  {selected.online ? (
                    <span className="inline-flex items-center gap-1">
                      <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                      Online
                    </span>
                  ) : (
                    "Offline"
                  )}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {selected.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.from === "me"
                        ? "bg-bryant-gold text-white rounded-br-md"
                        : "bg-bryant-gray-100 text-bryant-gray-900 rounded-bl-md"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        msg.from === "me" ? "text-white/70" : "text-bryant-gray-400"
                      }`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input bar */}
            <div className="border-t border-bryant-gray-200 px-4 py-3">
              <div className="flex gap-2">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  rows={1}
                  className="block w-full rounded-lg border border-bryant-gray-300 px-3 py-2 text-sm text-bryant-gray-900 placeholder:text-bryant-gray-400 focus:border-bryant-gold focus:outline-none focus:ring-2 focus:ring-bryant-gold focus:ring-offset-0 transition-colors resize-none"
                />
                <Button variant="primary" size="md" disabled={!messageInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            icon={<MessageSquare className="h-12 w-12" />}
            title="No conversation selected"
            description="Choose a conversation from the list to start messaging."
            className="flex-1"
          />
        )}
      </div>
    </div>
  );
}
