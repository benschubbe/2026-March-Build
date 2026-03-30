"use client";

import { Search, Bell } from "lucide-react";
import { useState } from "react";

interface TopbarProps {
  pageTitle: string;
}

export function Topbar({ pageTitle }: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-bryant-gray-200 bg-white px-6">
      {/* Left: Page title */}
      <h2 className="text-lg font-semibold text-bryant-black">{pageTitle}</h2>

      {/* Right: Search, notifications, avatar */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bryant-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-56 rounded-lg border border-bryant-gray-200 bg-bryant-gray-50 pl-9 pr-3 text-sm text-bryant-black placeholder:text-bryant-gray-400 focus:border-bryant-gold focus:outline-none focus:ring-1 focus:ring-bryant-gold"
          />
        </div>

        {/* Notification bell */}
        <button
          type="button"
          className="relative rounded-lg p-2 text-bryant-gray-500 transition-colors hover:bg-bryant-gray-100"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User avatar dropdown trigger */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-bryant-gold/20 text-sm font-semibold text-bryant-gold transition-colors hover:bg-bryant-gold/30"
        >
          BS
        </button>
      </div>
    </header>
  );
}
