"use client";

import React, { useState } from "react";
import {
  Award,
  Plus,
  ExternalLink,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { formatDate } from "@/lib/utils";

interface Certification {
  id: string;
  name: string;
  provider: string;
  completionDate: string;
  verificationUrl: string;
  color: string;
}

interface RecommendedCert {
  id: string;
  name: string;
  provider: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime: string;
  externalUrl: string;
  color: string;
}

const PROVIDER_OPTIONS = [
  { value: "", label: "Select Provider" },
  { value: "Coursera", label: "Coursera" },
  { value: "DataCamp", label: "DataCamp" },
  { value: "edX", label: "edX" },
  { value: "AWS", label: "AWS" },
  { value: "Google", label: "Google" },
  { value: "Tableau", label: "Tableau" },
  { value: "IBM", label: "IBM" },
  { value: "Other", label: "Other" },
];

const PROVIDER_COLORS: Record<string, string> = {
  Google: "bg-blue-500",
  IBM: "bg-blue-700",
  Tableau: "bg-indigo-600",
  DataCamp: "bg-green-600",
  AWS: "bg-orange-500",
  Coursera: "bg-blue-600",
  edX: "bg-red-600",
  Other: "bg-gray-500",
};

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner: "bg-green-100 text-green-800",
  Intermediate: "bg-amber-100 text-amber-800",
  Advanced: "bg-red-100 text-red-800",
};

const INITIAL_EARNED: Certification[] = [
  {
    id: "1",
    name: "Google Data Analytics Professional Certificate",
    provider: "Google",
    completionDate: "2025-12-15",
    verificationUrl: "https://coursera.org/verify/professional-cert/EXAMPLE1",
    color: "bg-blue-500",
  },
  {
    id: "2",
    name: "IBM Data Science Professional Certificate",
    provider: "IBM",
    completionDate: "2025-10-20",
    verificationUrl: "https://coursera.org/verify/professional-cert/EXAMPLE2",
    color: "bg-blue-700",
  },
  {
    id: "3",
    name: "Tableau Desktop Specialist",
    provider: "Tableau",
    completionDate: "2026-01-08",
    verificationUrl: "https://www.credly.com/badges/EXAMPLE3",
    color: "bg-indigo-600",
  },
  {
    id: "4",
    name: "SQL Fundamentals",
    provider: "DataCamp",
    completionDate: "2025-09-05",
    verificationUrl: "https://www.datacamp.com/certificate/EXAMPLE4",
    color: "bg-green-600",
  },
  {
    id: "5",
    name: "AWS Cloud Practitioner",
    provider: "AWS",
    completionDate: "2026-02-14",
    verificationUrl: "https://www.credly.com/badges/EXAMPLE5",
    color: "bg-orange-500",
  },
];

const RECOMMENDED: RecommendedCert[] = [
  {
    id: "r1",
    name: "Advanced SQL for Analytics",
    provider: "DataCamp",
    description:
      "Master window functions, CTEs, recursive queries, and performance tuning for analytical workloads. Ideal for analysts who want to move beyond basic querying.",
    difficulty: "Intermediate",
    estimatedTime: "~20 hours",
    externalUrl: "https://www.datacamp.com",
    color: "bg-green-600",
  },
  {
    id: "r2",
    name: "Machine Learning Specialization",
    provider: "Coursera",
    description:
      "Andrew Ng's comprehensive introduction to machine learning covering supervised learning, unsupervised learning, and best practices. A foundational course for aspiring data scientists.",
    difficulty: "Intermediate",
    estimatedTime: "~3 months",
    externalUrl: "https://www.coursera.org",
    color: "bg-blue-600",
  },
  {
    id: "r3",
    name: "Sportradar API Certification",
    provider: "Other",
    description:
      "Learn to work with Sportradar's suite of sports data APIs covering live odds, play-by-play, and historical statistics across major North American and international leagues.",
    difficulty: "Advanced",
    estimatedTime: "~15 hours",
    externalUrl: "https://sportradar.com",
    color: "bg-gray-500",
  },
];

export default function CertificationsPage() {
  const [earnedCerts, setEarnedCerts] = useState<Certification[]>(INITIAL_EARNED);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formProvider, setFormProvider] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formUrl, setFormUrl] = useState("");

  const inProgressCount = 3;

  const handleAdd = () => {
    if (!formName || !formProvider || !formDate) return;
    const newCert: Certification = {
      id: Date.now().toString(),
      name: formName,
      provider: formProvider,
      completionDate: formDate,
      verificationUrl: formUrl,
      color: PROVIDER_COLORS[formProvider] || PROVIDER_COLORS.Other,
    };
    setEarnedCerts((prev) => [newCert, ...prev]);
    setFormName("");
    setFormProvider("");
    setFormDate("");
    setFormUrl("");
    setModalOpen(false);
  };

  const handleRemove = (id: string) => {
    setEarnedCerts((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-bryant-gray-900">
            My Certifications
          </h1>
          <p className="mt-1 text-sm text-bryant-gray-500">
            Track your professional development and credentials
          </p>
        </div>
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Certification
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-bryant-gray-900">
                {earnedCerts.length}
              </p>
              <p className="text-sm text-bryant-gray-500">Certifications Earned</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-bryant-gray-900">
                {inProgressCount}
              </p>
              <p className="text-sm text-bryant-gray-500">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-bryant-gray-900">
                {RECOMMENDED.length}
              </p>
              <p className="text-sm text-bryant-gray-500">Recommended for You</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earned Certifications */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-bryant-gray-900 flex items-center gap-2">
          <Award className="h-5 w-5 text-bryant-gold" />
          Earned
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {earnedCerts.map((cert) => (
            <Card key={cert.id} className="hover:shadow-md transition-shadow">
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white font-bold text-sm ${cert.color}`}
                  >
                    {cert.provider.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-bryant-gray-900 leading-snug">
                      {cert.name}
                    </h3>
                    <p className="text-sm text-bryant-gray-500">{cert.provider}</p>
                  </div>
                </div>

                <p className="text-xs text-bryant-gray-500">
                  Completed {formatDate(cert.completionDate)}
                </p>

                <div className="flex items-center gap-2">
                  {cert.verificationUrl && (
                    <a
                      href={cert.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Verify
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(cert.id)}
                    className="text-bryant-gray-400 hover:text-error"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recommended Certifications */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-bryant-gray-900 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Recommended for You
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {RECOMMENDED.map((cert) => (
            <Card key={cert.id} className="hover:shadow-md transition-shadow">
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white font-bold text-sm ${cert.color}`}
                  >
                    {cert.provider.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-bryant-gray-900 leading-snug">
                      {cert.name}
                    </h3>
                    <p className="text-sm text-bryant-gray-500">{cert.provider}</p>
                  </div>
                </div>

                <p className="text-sm text-bryant-gray-600 leading-relaxed">
                  {cert.description}
                </p>

                <div className="flex items-center gap-3 text-xs text-bryant-gray-500">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium ${DIFFICULTY_STYLES[cert.difficulty]}`}
                  >
                    {cert.difficulty}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {cert.estimatedTime}
                  </span>
                </div>

                <a
                  href={cert.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full">
                    Start
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Certification Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Certification"
      >
        <div className="space-y-4">
          <Input
            label="Certification Name"
            placeholder="e.g. Google Data Analytics Professional Certificate"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />

          <Select
            label="Provider"
            options={PROVIDER_OPTIONS}
            value={formProvider}
            onChange={(e) => setFormProvider(e.target.value)}
          />

          <Input
            label="Completion Date"
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
          />

          <Input
            label="Verification URL (optional)"
            placeholder="https://..."
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAdd}
              disabled={!formName || !formProvider || !formDate}
            >
              <Plus className="h-4 w-4" />
              Add Certification
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
