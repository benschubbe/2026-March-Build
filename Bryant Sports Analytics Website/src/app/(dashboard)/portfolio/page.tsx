"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  ExternalLink,
  Code,
  Globe,
  Plus,
  X,
  Eye,
  Save,
  Award,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/* ---------- mock profile ---------- */
const INITIAL_PROFILE = {
  name: "Ben Schubbe",
  username: "bschubbe",
  headline: "Data Science & Sports Analytics | Bryant University '26",
  bio: "Junior at Bryant University pursuing a B.S. in Data Science with a concentration in Sports Analytics. Passionate about applying machine learning and statistical modeling to NBA and NFL data. Currently exploring draft prospect evaluation models and player performance prediction systems.",
  classYear: 2026,
  concentration: "Data Science",
  linkedinUrl: "https://linkedin.com/in/benschubbe",
  githubUrl: "https://github.com/benschubbe",
  websiteUrl: "https://benschubbe.dev",
  skills: [
    "Python",
    "R",
    "SQL",
    "Tableau",
    "Machine Learning",
    "Web Scraping",
    "NBA Analytics",
    "NFL Analytics",
    "Statistical Modeling",
    "Pandas",
    "scikit-learn",
  ],
  certifications: [
    { id: "1", name: "Google Data Analytics Professional Certificate", provider: "Google", date: "2025-05-15" },
    { id: "2", name: "IBM Data Science Specialization", provider: "IBM", date: "2025-08-20" },
    { id: "3", name: "Tableau Desktop Specialist", provider: "Tableau", date: "2025-11-10" },
  ],
};

export default function PortfolioEditPage() {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [newSkill, setNewSkill] = useState("");
  const [newCertName, setNewCertName] = useState("");
  const [newCertProvider, setNewCertProvider] = useState("");
  const [saving, setSaving] = useState(false);

  /* ---- helpers ---- */
  function updateField(field: string, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  function addSkill() {
    const trimmed = newSkill.trim();
    if (!trimmed || profile.skills.includes(trimmed)) return;
    setProfile((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
    setNewSkill("");
  }

  function removeSkill(skill: string) {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  }

  function addCertification() {
    if (!newCertName.trim()) return;
    const cert = {
      id: Date.now().toString(),
      name: newCertName.trim(),
      provider: newCertProvider.trim() || "Other",
      date: new Date().toISOString().split("T")[0],
    };
    setProfile((prev) => ({
      ...prev,
      certifications: [...prev.certifications, cert],
    }));
    setNewCertName("");
    setNewCertProvider("");
  }

  function removeCertification(id: string) {
    setProfile((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c.id !== id),
    }));
  }

  function handleSave() {
    setSaving(true);
    // Simulate save
    setTimeout(() => setSaving(false), 1200);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bryant-gray-900">My Portfolio</h1>
          <p className="mt-1 text-sm text-bryant-gray-500">
            Customize your public portfolio that peers and recruiters can view.
          </p>
        </div>
        <Link href={`/portfolio/${profile.username}`}>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4" />
            Preview Portfolio
          </Button>
        </Link>
      </div>

      {/* Profile card */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-bryant-gray-900">Profile</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar + Name */}
          <div className="flex items-center gap-5">
            <Avatar name={profile.name} size="xl" />
            <div className="flex-1 space-y-1">
              <p className="text-xl font-bold text-bryant-gray-900">{profile.name}</p>
              <p className="text-sm text-bryant-gray-500">
                Class of {profile.classYear} &middot; {profile.concentration}
              </p>
            </div>
          </div>

          {/* Headline */}
          <Input
            label="Headline"
            placeholder="e.g. Data Science & Sports Analytics Enthusiast"
            value={profile.headline}
            onChange={(e) => updateField("headline", e.target.value)}
          />

          {/* Bio */}
          <Textarea
            label="Bio"
            placeholder="Tell recruiters and peers about yourself..."
            rows={5}
            value={profile.bio}
            onChange={(e) => updateField("bio", e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Links card */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-bryant-gray-900">Links</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <ExternalLink className="mb-2 h-5 w-5 shrink-0 text-[#0A66C2]" />
            <Input
              label="LinkedIn URL"
              placeholder="https://linkedin.com/in/yourname"
              value={profile.linkedinUrl}
              onChange={(e) => updateField("linkedinUrl", e.target.value)}
            />
          </div>
          <div className="flex items-end gap-3">
            <Code className="mb-2 h-5 w-5 shrink-0 text-bryant-gray-800" />
            <Input
              label="GitHub URL"
              placeholder="https://github.com/yourname"
              value={profile.githubUrl}
              onChange={(e) => updateField("githubUrl", e.target.value)}
            />
          </div>
          <div className="flex items-end gap-3">
            <Globe className="mb-2 h-5 w-5 shrink-0 text-bryant-gold" />
            <Input
              label="Personal Website"
              placeholder="https://yoursite.dev"
              value={profile.websiteUrl}
              onChange={(e) => updateField("websiteUrl", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Skills card */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-bryant-gray-900">Skills</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing skills */}
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <Badge key={skill} variant="tool" className="gap-1 pr-1.5">
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="ml-1 inline-flex items-center rounded-full p-0.5 hover:bg-green-200"
                  aria-label={`Remove ${skill}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Add skill */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
            />
            <Button variant="outline" size="sm" onClick={addSkill} className="shrink-0">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Certifications card */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-bryant-gray-900">Certifications</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.certifications.length === 0 && (
            <p className="text-sm text-bryant-gray-400">No certifications added yet.</p>
          )}
          {profile.certifications.map((cert) => (
            <div
              key={cert.id}
              className="flex items-center justify-between rounded-lg border border-bryant-gray-200 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-bryant-gold" />
                <div>
                  <p className="text-sm font-medium text-bryant-gray-900">{cert.name}</p>
                  <p className="text-xs text-bryant-gray-500">{cert.provider}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeCertification(cert.id)}
                className="text-bryant-gray-400 hover:text-error"
                aria-label={`Remove ${cert.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Add certification */}
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-bryant-gray-300 p-4 sm:flex-row sm:items-end">
            <Input
              label="Certification Name"
              placeholder="e.g. AWS Cloud Practitioner"
              value={newCertName}
              onChange={(e) => setNewCertName(e.target.value)}
            />
            <Input
              label="Provider"
              placeholder="e.g. Amazon"
              value={newCertProvider}
              onChange={(e) => setNewCertProvider(e.target.value)}
            />
            <Button variant="outline" size="sm" onClick={addCertification} className="shrink-0">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save bar */}
      <CardFooter className="sticky bottom-0 z-10 rounded-xl border border-bryant-gray-200 bg-white shadow-md">
        <div className="flex w-full items-center justify-between">
          <p className="text-sm text-bryant-gray-500">
            Changes are saved to your profile and visible on your public portfolio.
          </p>
          <div className="flex gap-3">
            <Link href={`/portfolio/${profile.username}`}>
              <Button variant="outline">
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            </Link>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </CardFooter>
    </div>
  );
}
