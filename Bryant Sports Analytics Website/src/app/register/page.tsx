"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const classYearOptions = [
  { value: "2024", label: "Class of 2024" },
  { value: "2025", label: "Class of 2025" },
  { value: "2026", label: "Class of 2026" },
  { value: "2027", label: "Class of 2027" },
  { value: "2028", label: "Class of 2028" },
];

const concentrationOptions = [
  { value: "data-science", label: "Data Science" },
  { value: "finance", label: "Finance" },
  { value: "marketing", label: "Marketing" },
  { value: "management", label: "Management" },
  { value: "other", label: "Other" },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    classYear: "",
    concentration: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          classYear: form.classYear,
          concentration: form.concentration,
          role: "STUDENT",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Registration failed. Please try again.");
      } else {
        window.location.href = "/login?registered=true";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bryant-black px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-bryant-gold/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r from-bryant-gold to-bryant-gold-light" />
          <h1 className="text-2xl font-bold text-white">
            Bryant Sports{" "}
            <span className="text-bryant-gold">Analytics Hub</span>
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Create your account
          </p>
        </div>

        <Card className="border-bryant-gray-800 bg-bryant-gray-900">
          <CardContent className="py-8">
            {error && (
              <div className="mb-6 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Full Name"
                type="text"
                placeholder="Jane Doe"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
                className="border-bryant-gray-700 bg-bryant-gray-800 text-white placeholder:text-bryant-gray-500"
              />

              <Input
                label="Email"
                type="email"
                placeholder="you@bryant.edu"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
                className="border-bryant-gray-700 bg-bryant-gray-800 text-white placeholder:text-bryant-gray-500"
              />

              <Input
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                required
                className="border-bryant-gray-700 bg-bryant-gray-800 text-white placeholder:text-bryant-gray-500"
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                required
                className="border-bryant-gray-700 bg-bryant-gray-800 text-white placeholder:text-bryant-gray-500"
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Class Year"
                  placeholder="Select year"
                  options={classYearOptions}
                  value={form.classYear}
                  onChange={(e) => updateField("classYear", e.target.value)}
                  required
                  className="border-bryant-gray-700 bg-bryant-gray-800 text-white"
                />

                <Select
                  label="Concentration"
                  placeholder="Select"
                  options={concentrationOptions}
                  value={form.concentration}
                  onChange={(e) => updateField("concentration", e.target.value)}
                  required
                  className="border-bryant-gray-700 bg-bryant-gray-800 text-white"
                />
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                Create Account
              </Button>
            </form>

            {/* Login link */}
            <p className="mt-6 text-center text-sm text-bryant-gray-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-bryant-gold transition-colors hover:text-bryant-gold-light"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
