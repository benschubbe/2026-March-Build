"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

const SPORTS = [
  "NFL",
  "NBA",
  "MLB",
  "NHL",
  "MLS",
  "College Football",
  "College Basketball",
  "Tennis",
  "Golf",
  "Soccer",
  "Esports",
];

const TECHNIQUES = [
  "Regression",
  "Classification",
  "Clustering",
  "Time Series",
  "NLP",
  "Computer Vision",
  "Simulation",
  "Bayesian Inference",
  "Neural Networks",
  "Web Scraping",
  "Geospatial",
];

const TOOLS = [
  "Python",
  "R",
  "SQL",
  "Tableau",
  "Power BI",
  "Excel",
  "Stata",
  "MATLAB",
  "dbt",
  "Spark",
];

const DOMAINS = [
  "Player Evaluation",
  "Draft Modeling",
  "In-Game Strategy",
  "Injury Prediction",
  "Fan Engagement",
  "Ticket Pricing",
  "Salary Cap",
  "Betting Markets",
  "Broadcast Analytics",
  "Recruiting",
];

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "bryant-only", label: "Bryant Only" },
  { value: "private", label: "Private" },
];

function CheckboxGrid({
  label,
  items,
  selected,
  onChange,
}: {
  label: string;
  items: string[];
  selected: string[];
  onChange: (items: string[]) => void;
}) {
  const toggle = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter((s) => s !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-bryant-gray-700">
        {label}
      </label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item) => (
          <label
            key={item}
            className="flex items-center gap-2 rounded-lg border border-bryant-gray-200 px-3 py-2 text-sm cursor-pointer hover:bg-bryant-gray-50 transition-colors has-[:checked]:border-bryant-gold has-[:checked]:bg-bryant-gold/5"
          >
            <input
              type="checkbox"
              checked={selected.includes(item)}
              onChange={() => toggle(item)}
              className="h-4 w-4 rounded border-bryant-gray-300 text-bryant-gold focus:ring-bryant-gold"
            />
            <span className="text-bryant-gray-700">{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function NewProjectPage() {
  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [sports, setSports] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("public");
  const [content, setContent] = useState("");
  const [methodology, setMethodology] = useState("");
  const [techniques, setTechniques] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [tableauUrl, setTableauUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [openForReview, setOpenForReview] = useState(true);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back Link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-bryant-gray-500 hover:text-bryant-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      <h1 className="text-2xl font-bold text-bryant-gray-900">
        Create New Project
      </h1>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-bryant-gray-900">
            Basic Info
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g. NFL Expected Points Model Using nflFastR"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            label="Abstract"
            placeholder="A brief summary of your project (2-3 sentences)..."
            rows={3}
            value={abstract}
            onChange={(e) => setAbstract(e.target.value)}
          />
          <CheckboxGrid
            label="Sports"
            items={SPORTS}
            selected={sports}
            onChange={setSports}
          />
          <Select
            label="Visibility"
            options={VISIBILITY_OPTIONS}
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-bryant-gray-900">
            Content
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="Write-Up (Markdown supported)"
            placeholder="Describe your project in detail. You can use Markdown formatting..."
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Textarea
            label="Methodology"
            placeholder="Describe the data sources, methods, and techniques used..."
            rows={6}
            value={methodology}
            onChange={(e) => setMethodology(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-bryant-gray-900">Tags</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <CheckboxGrid
            label="Techniques"
            items={TECHNIQUES}
            selected={techniques}
            onChange={setTechniques}
          />
          <CheckboxGrid
            label="Tools"
            items={TOOLS}
            selected={tools}
            onChange={setTools}
          />
          <CheckboxGrid
            label="Domains"
            items={DOMAINS}
            selected={domains}
            onChange={setDomains}
          />
        </CardContent>
      </Card>

      {/* Media & Links */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-bryant-gray-900">
            Media & Links
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="GitHub URL"
            placeholder="https://github.com/username/repo"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
          <Input
            label="Tableau URL"
            placeholder="https://public.tableau.com/views/..."
            value={tableauUrl}
            onChange={(e) => setTableauUrl(e.target.value)}
          />
          <Input
            label="Video URL"
            placeholder="https://youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />

          {/* File Upload Placeholder */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-bryant-gray-700">
              Attachments
            </label>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-bryant-gray-300 px-6 py-10 text-center hover:border-bryant-gold transition-colors cursor-pointer">
              <Upload className="mx-auto h-10 w-10 text-bryant-gray-400" />
              <p className="mt-2 text-sm text-bryant-gray-600">
                <span className="font-medium text-bryant-gold">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="mt-1 text-xs text-bryant-gray-400">
                PDF, CSV, XLSX, PNG, JPG up to 10 MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Settings */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-bryant-gray-900">
            Review Settings
          </h2>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={openForReview}
              onChange={(e) => setOpenForReview(e.target.checked)}
              className="h-4 w-4 rounded border-bryant-gray-300 text-bryant-gold focus:ring-bryant-gold"
            />
            <div>
              <span className="text-sm font-medium text-bryant-gray-700">
                Open for Peer Review
              </span>
              <p className="text-sm text-bryant-gray-500">
                Allow other members to submit formal peer reviews of your
                project
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Bottom Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-bryant-gray-200 pt-6">
        <Button variant="outline">Save Draft</Button>
        <Button variant="primary">Publish Project</Button>
      </div>
    </div>
  );
}
