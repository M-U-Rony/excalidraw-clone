"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = "http://localhost:3001";

type AuthPageProps = {
  isSignup: boolean;
};

export default function Authpage({ isSignup }: AuthPageProps) {

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const heading = isSignup ? "Create your account" : "Welcome back";
  const subheading = isSignup
    ? "Sign up to start drawing and collaborating."
    : "Sign in to continue to your workspace.";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const endpoint = isSignup ? "/signup" : "/signin";
      const payload = isSignup
        ? { email, password, name: username }
        : { email, password };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "Request failed");
      }

      if (!isSignup) {
        router.push("/dashboard");
      }

      setSuccess(
        isSignup
          ? "Account created successfully. You can sign in now."
          : "Signed in successfully."
      );

      if (isSignup) {
        setUsername("");
      }

      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 px-6 py-6">
      <section className="mx-auto w-full max-w-[440px] rounded-[20px] border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold leading-tight text-slate-950">{heading}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{subheading}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignup ? (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-950">Username</span>
              <input
                className="w-full rounded-[12px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </label>
          ) : null}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-950">Email</span>
            <input
              className="w-full rounded-[12px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-950">Password</span>
            <input
              className="w-full rounded-[12px] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-[12px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (isSignup ? "Creating account..." : "Signing in...") : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          {isSignup ? "Already have an account?" : "Need an account?"}{" "}
          <Link
            href={isSignup ? "/signin" : "/signup"}
            className="font-semibold text-slate-950 underline-offset-4 hover:underline"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </Link>
        </p>
      </section>
    </main>
  );
}
