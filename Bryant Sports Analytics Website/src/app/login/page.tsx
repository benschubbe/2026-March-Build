"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Code, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        window.location.href = "/portfolio";
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-md">
      {/* Branding */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r from-bryant-gold to-bryant-gold-light" />
        <h1 className="text-2xl font-bold text-white">
          Bryant Sports{" "}
          <span className="text-bryant-gold">Analytics Hub</span>
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Sign in to your account
        </p>
      </div>

      <Card className="border-bryant-gray-800 bg-bryant-gray-900">
        <CardContent className="py-8">
          {justRegistered && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Account created successfully! Sign in below.
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@bryant.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-bryant-gray-700 bg-bryant-gray-800 text-white placeholder:text-bryant-gray-500"
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-bryant-gray-700 bg-bryant-gray-800 text-white placeholder:text-bryant-gray-500"
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-bryant-gray-700" />
            <span className="text-xs text-bryant-gray-500">
              or continue with
            </span>
            <div className="h-px flex-1 bg-bryant-gray-700" />
          </div>

          {/* Social sign-in */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="border-bryant-gray-700 text-white hover:bg-bryant-gray-800"
              onClick={() => signIn("github", { callbackUrl: "/portfolio" })}
            >
              <Code className="h-4 w-4" />
              GitHub
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-bryant-gray-700 text-white hover:bg-bryant-gray-800"
              onClick={() => signIn("google", { callbackUrl: "/portfolio" })}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
          </div>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-bryant-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-bryant-gold transition-colors hover:text-bryant-gold-light"
            >
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bryant-black px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-bryant-gold/5 blur-3xl" />
      </div>

      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
