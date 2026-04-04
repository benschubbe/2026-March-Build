"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";

const classYearOptions = [
  { value: "2025", label: "Class of 2025" },
  { value: "2026", label: "Class of 2026" },
  { value: "2027", label: "Class of 2027" },
  { value: "2028", label: "Class of 2028" },
  { value: "2029", label: "Class of 2029" },
];

const concentrationOptions = [
  { value: "data-science", label: "Data Science" },
  { value: "finance", label: "Finance" },
  { value: "marketing", label: "Marketing" },
  { value: "management", label: "Management" },
  { value: "information-systems", label: "Information Systems" },
  { value: "economics", label: "Economics" },
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (error) setError("");
  }

  function validateEmail(email: string): string | null {
    if (!email.trim()) return "Email is required.";
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain || !domain.endsWith(".edu")) {
      return "Please use a valid university .edu email address.";
    }
    return null;
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!form.name.trim()) errors.name = "Full name is required.";

    const emailErr = validateEmail(form.email);
    if (emailErr) errors.email = emailErr;

    if (!form.password) {
      errors.password = "Password is required.";
    } else if (form.password.length < 8) {
      errors.password = "Must be at least 8 characters.";
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (!form.classYear) errors.classYear = "Required.";
    if (!form.concentration) errors.concentration = "Required.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          classYear: form.classYear,
          concentration: form.concentration,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Show specific error from the API
        setError(data.error || "Registration failed. Please try again.");

        // Highlight the email field if it's a duplicate
        if (res.status === 409) {
          setFieldErrors((prev) => ({
            ...prev,
            email: "This email is already registered.",
          }));
        }
      } else {
        setSuccess(true);
      }
    } catch {
      setError(
        "Unable to connect to the server. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Success state
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bryant-black px-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-bryant-gold/5 blur-3xl" />
        </div>
        <div className="relative w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Account Created!
          </h1>
          <p className="text-white/60 mb-8">
            Welcome to Bryant Sports Analytics Hub. You can now sign in with
            your credentials.
          </p>
          <Link href="/login">
            <Button size="lg" className="w-full max-w-xs">
              Sign In to Your Account
            </Button>
          </Link>
        </div>
      </div>
    );
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
            Create your account with a valid .edu email
          </p>
        </div>

        <Card className="border-bryant-gray-800 bg-bryant-gray-900">
          <CardContent className="py-8">
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Full Name"
                type="text"
                placeholder="Jane Doe"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                error={fieldErrors.name}
                required
                className="border-bryant-gray-700 bg-bryant-gray-800 text-white placeholder:text-bryant-gray-500"
              />

              <div>
                <Input
                  label="University Email"
                  type="email"
                  placeholder="you@bryant.edu"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  error={fieldErrors.email}
                  required
                  className="border-bryant-gray-700 bg-bryant-gray-800 text-white placeholder:text-bryant-gray-500"
                />
                {!fieldErrors.email && (
                  <p className="mt-1 text-xs text-bryant-gray-500">
                    Must be a valid .edu email address
                  </p>
                )}
              </div>

              <Input
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                error={fieldErrors.password}
                required
                className="border-bryant-gray-700 bg-bryant-gray-800 text-white placeholder:text-bryant-gray-500"
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                error={fieldErrors.confirmPassword}
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
                {loading ? "Creating Account..." : "Create Account"}
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
