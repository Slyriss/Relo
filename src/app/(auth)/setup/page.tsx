"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  User,
  Zap,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { CrawledProfile, ProfileVisibility } from "@/types";

const STEPS = ["Account", "Discover", "Privacy"] as const;

const SCAN_STEPS = [
  "Checking the public profile URL...",
  "Reading available metadata...",
  "Extracting profile context...",
  "Preparing editable profile fields...",
  "Building your profile...",
];

const ROLE_OPTIONS = [
  { value: "attendee", label: "Attendee", desc: "I'm here to network and find opportunities" },
  { value: "organizer", label: "Organizer", desc: "I'm hosting or managing an event" },
] as const;

type VisibilityKey = keyof ProfileVisibility;
const VISIBILITY_FIELDS: { key: VisibilityKey; label: string; desc: string }[] = [
  { key: "company", label: "Company", desc: "Your current employer" },
  { key: "title", label: "Job title", desc: "Your role at work" },
  { key: "industry", label: "Industry", desc: "Sector you work in" },
  { key: "location", label: "Location", desc: "City or region" },
  { key: "bio", label: "Bio", desc: "Your personal blurb" },
  { key: "email", label: "Email address", desc: "Hidden by default — share at your discretion" },
  { key: "linkedinUrl", label: "LinkedIn URL", desc: "Hidden by default" },
];

export default function SetupPage() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const events = useAppStore((state) => state.events);
  const updateUser = useAppStore((state) => state.updateUser);
  const setVisibility = useAppStore((state) => state.setVisibility);

  const [step, setStep] = useState(0);

  // Step 0 state
  const [name, setName] = useState(user?.name ?? "");
  const [role, setRole] = useState<"attendee" | "organizer">(user?.role === "organizer" ? "organizer" : "attendee");
  const canChooseOrganizer = user?.role === "organizer" || user?.role === "admin";

  // Step 1 state
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "found" | "error">("idle");
  const [scanStep, setScanStep] = useState(0);
  const [scanError, setScanError] = useState("");
  const [discovered, setDiscovered] = useState<CrawledProfile | null>(null);

  // Step 2 state — mirrors store visibility
  const visibility = user?.visibility;

  async function handleStep0() {
    updateUser({ name: name.trim(), role: canChooseOrganizer ? role : "attendee" });
    setStep(1);
  }

  async function runScan() {
    if (!linkedinUrl.trim()) return;
    setScanStatus("scanning");
    setScanStep(0);
    setScanError("");

    for (let i = 0; i < SCAN_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 350));
      setScanStep(i + 1);
    }

    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not discover that profile.");
      setDiscovered(data.profile);
      updateUser({
        ...data.profile,
        linkedinUrl,
        crawlStatus: "found",
        crawledAt: new Date().toISOString(),
      });
      setScanStatus("found");
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Could not discover that profile.");
      setScanStatus("error");
    }
  }

  function handleStep1() {
    setStep(2);
  }

  function handleComplete() {
    const resolvedRole = canChooseOrganizer ? role : "attendee";
    if (resolvedRole === "attendee") {
      const event = events[0];
      router.push(event ? `/events/${event.id || event.slug}` : "/login");
      return;
    }

    router.push("/dashboard/events");
  }

  if (!user) return null;

  return (
    <main className="grid min-h-screen place-items-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-lg space-y-6">

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "border-2 border-primary text-primary"
                    : "border border-muted-foreground/30 text-muted-foreground/50"
                )}
              >
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  i === step ? "text-foreground" : "text-muted-foreground/60"
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={cn("mx-1 h-px flex-1 w-8 bg-border", i < step && "bg-primary")} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Account basics */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Welcome to Relo</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tell us a bit about yourself to get started.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Your name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">I&apos;m joining as</label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLE_OPTIONS.map((opt) => {
                    const disabled = opt.value === "organizer" && !canChooseOrganizer;
                    return (
                    <button
                      key={opt.value}
                      onClick={() => !disabled && setRole(opt.value)}
                      disabled={disabled}
                      className={cn(
                        "rounded-xl border p-3 text-left transition",
                        role === opt.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : disabled
                            ? "cursor-not-allowed opacity-50"
                          : "hover:border-border/80 hover:bg-muted/40"
                      )}
                    >
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {disabled ? "Organizer access is invite-only" : opt.desc}
                      </p>
                    </button>
                  )})}
                </div>
              </div>

              <Button
                onClick={handleStep0}
                disabled={!name.trim()}
                className="w-full"
                size="lg"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 1: LinkedIn discovery */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Zap className="h-5 w-5 text-primary" />
                Discover your profile
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Paste a public profile URL to import available metadata. LinkedIn pages are not scraped directly; paste profile text instead when needed.
                Nothing is stored without your approval.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/yourname"
                  disabled={scanStatus === "scanning"}
                  className="flex-1"
                />
                <Button
                  onClick={runScan}
                  disabled={scanStatus === "scanning" || !linkedinUrl.trim()}
                >
                  {scanStatus === "scanning" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Scan"
                  )}
                </Button>
              </div>

              {scanStatus === "scanning" && (
                <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                  {SCAN_STEPS.map((label, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-2 text-sm transition-all duration-300",
                        i < scanStep ? "text-foreground" : "text-muted-foreground/40"
                      )}
                    >
                      {i < scanStep ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      ) : i === scanStep ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                      ) : (
                        <div className="h-4 w-4 shrink-0 rounded-full border border-muted-foreground/20" />
                      )}
                      {label}
                    </div>
                  ))}
                </div>
              )}

              {scanStatus === "found" && discovered && (
                <div className="rounded-xl border bg-emerald-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Profile discovered
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {discovered.company && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate">{discovered.company}</span>
                      </div>
                    )}
                    {discovered.title && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate">{discovered.title}</span>
                      </div>
                    )}
                    {discovered.industry && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="text-muted-foreground">Industry:</span>
                        <span>{discovered.industry}</span>
                      </div>
                    )}
                    {discovered.location && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{discovered.location}</span>
                      </div>
                    )}
                  </div>
                  {discovered.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-3 border-t pt-2">
                      {discovered.bio}
                    </p>
                  )}
                </div>
              )}

              {scanStatus === "error" && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {scanError || "Couldn&apos;t scan that profile. Check the URL and try again."}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  Skip for now
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleStep1}
                  disabled={scanStatus === "scanning"}
                >
                  {scanStatus === "found" ? "Looks good" : "Continue"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Privacy toggles */}
        {step === 2 && visibility && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Set your privacy</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose what event attendees can see on your profile. You can change this any time in Settings.
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                {VISIBILITY_FIELDS.map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-xl border bg-background px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <button
                      onClick={() => setVisibility(key, !visibility[key])}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                        visibility[key]
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {visibility[key] ? (
                        <Eye className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                      {visibility[key] ? "Visible" : "Hidden"}
                    </button>
                  </div>
                ))}
              </div>

              <Button onClick={handleComplete} className="w-full" size="lg">
                <Sparkles className="h-4 w-4" />
                Complete setup
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                You can update any of this later from your profile settings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
