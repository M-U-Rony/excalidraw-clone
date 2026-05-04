"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [roomName, setRoomName] = useState("");
  const router = useRouter();

  return (
    <main className="min-h-screen px-6 py-6 bg-[radial-gradient(circle_at_top_left,_#dbeafe_0%,_#eff6ff_28%,_#f8fafc_62%,_#e2e8f0_100%)] font-sans">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] max-w-[1180px] flex-col gap-6 rounded-[28px] border border-slate-300/25 bg-white/80 p-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-slate-950 text-lg font-bold tracking-[-0.03em]">
            SketchBoard
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="text-slate-700 text-sm font-semibold"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Sign up
            </Link>
          </div>
        </div>

        <div className="grid gap-8 py-6 md:grid-cols-[minmax(300px,1fr)_minmax(300px,1fr)] items-center">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-sky-200 px-3 py-1 text-[0.75rem] font-bold uppercase tracking-[0.06em] text-sky-700">
              Collaborative whiteboard
            </span>
            <h1 className="mt-4 text-5xl font-bold leading-[0.98] tracking-[-0.05em] text-slate-950 md:text-6xl">
              Draw ideas together in a room that is ready in seconds.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Create or join a shared room, sketch in real time, and keep the
              flow focused on the canvas instead of setup.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="whitespace-nowrap">Fast room entry</span>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span className="whitespace-nowrap">Clean drawing flow</span>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span className="whitespace-nowrap">Realtime collaboration</span>
            </div>
          </div>

          <div className="rounded-[24px] bg-slate-950/95 p-5 text-slate-200 shadow-[0_30px_60px_rgba(15,23,42,0.22)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-slate-400/15 px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.05em] text-slate-200">
                Live canvas
              </span>
              <span className="text-sm text-slate-300">3 collaborators</span>
            </div>

            <div className="relative min-h-[360px] overflow-hidden rounded-[20px] border border-slate-300/20 bg-[linear-gradient(180deg,rgba(51,65,85,0.3)_0%,rgba(15,23,42,0.15)_100%)]">
              <div className="absolute top-[46px] left-[38px] h-[96px] w-[150px] rounded-[20px] border border-sky-200/85 -rotate-2" />
              <div className="absolute right-[36px] top-[156px] h-[138px] w-[138px] rounded-full border border-sky-200/85" />
              <div className="absolute right-[72px] top-[132px] h-[2px] w-[170px] rotate-[-18deg] bg-amber-400" />
              <div className="absolute left-[48px] bottom-[42px] w-[190px] space-y-1.5 rounded-[16px] bg-slate-50 p-4 text-slate-950 shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                <span className="text-[0.75rem] font-bold uppercase tracking-[0.05em] text-slate-500">
                  Sprint plan
                </span>
                <span className="text-sm leading-6 text-slate-950">
                  Map, refine, decide, ship.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
