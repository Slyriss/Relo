"use client";

import { useState } from "react";
import {
  AlertCircle,
  Briefcase,
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Sparkles,
  Target,
  User,
  Zap,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ProfileFieldToggle } from "@/components/profile-field-toggle";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ProfileVisibility } from "@/types";

const SCAN_STEPS = [
  "Connecting to LinkedIn...",
  "Reading public profile...",
  "Extracting experience data...",
  "Analyzing skills & industry...",
  "Building your profile...",
];

export default function ProfileSettingsPage() {
  const user = useAppStore((state) => state.user);
  const updateUser = useAppStore((state) => state.updateUser);
  const setVisibility = useAppStore((state) => state.setVisibility);

  const [linkedinInput, setLinkedinInput] = useState(user?.linkedinUrl ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [headline, setHeadline] = useState(user?.headline ?? "");
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "found" | "error">(
    user?.crawlStatus ?? "idle"
  );
  const [scanStep, setScanStep] = useState(0);
  const [generatingBio, setGeneratingBio] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const visibility = user.visibility;

  const profileCompletionFields = [
    !!user.company,
    !!user.title,
    !!user.email,
    !!user.linkedinUrl,
    !!bio,
    !!user.industry,
    !!user.location,
  ];
  const completionPct = Math.round(
    (profileCompletionFields.filter(Boolean).length / profileCompletionFields.length) * 100
  );

  async function runScan() {
    if (!linkedinInput.trim()) return;
    setScanStatus("scanning");
    setScanStep(0);

    for (let i = 0; i < SCAN_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
      setScanStep(i + 1);
    }

    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl: linkedinInput }),
      });
      const data = await res.json();
      updateUser({
        ...data.profile,
        linkedinUrl: linkedinInput,
        crawlStatus: "found",
        crawledAt: new Date().toISOString(),
      });
      if (data.profile.bio) setBio(data.profile.bio);
      if (data.profile.headline) setHeadline(data.profile.headline);
      setScanStatus("found");
    } catch {
      setScanStatus("error");
    }
  }

  async function regenerateBio() {
    if (!user) return;
    setGeneratingBio(true);
    try {
      const res = await fetch("/api/bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          company: user.company,
          title: user.title,
          industry: user.industry,
          skills: user.skills,
        }),
      });
      const data = await res.json();
      setBio(data.bio);
    } finally {
      setGeneratingBio(false);
    }
  }

  function save() {
    updateUser({ bio, headline });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Profile header */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
          {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  completionPct >= 80 ? "bg-emerald-500" : completionPct >= 50 ? "bg-amber-500" : "bg-primary"
                )}
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {completionPct}% complete
            </span>
          </div>
        </div>
      </div>

      {/* Agent Discovery */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" />
            Agent Discovery
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Paste your LinkedIn URL and the agent will auto-populate your profile.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={linkedinInput}
              onChange={(e) => setLinkedinInput(e.target.value)}
              placeholder="https://linkedin.com/in/yourname"
              className="flex-1"
              disabled={scanStatus === "scanning"}
            />
            <Button
              onClick={runScan}
              disabled={scanStatus === "scanning" || !linkedinInput.trim()}
              size="md"
            >
              {scanStatus === "scanning" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning
                </>
              ) : (
                "Discover"
              )}
            </Button>
          </div>

          {scanStatus === "scanning" && (
            <div className="rounded-xl bg-muted/50 p-3 space-y-2">
              {SCAN_STEPS.map((step, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2 text-sm transition-all duration-300",
                    i < scanStep ? "text-foreground" : "text-muted-foreground/40"
                  )}
                >
                  {i < scanStep ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : i === scanStep ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
                  ) : (
                    <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-muted-foreground/20" />
                  )}
                  {step}
                </div>
              ))}
            </div>
          )}

          {scanStatus === "found" && (
            <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Profile discovered
                {user.crawledAt && (
                  <> · {new Date(user.crawledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>
                )}
                {user.company && (
                  <> — <strong>{user.name}</strong> · {user.title} at {user.company}</>
                )}
              </span>
            </div>
          )}

          {scanStatus === "error" && (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Couldn&apos;t scan that profile. Check the URL and try again.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile fields */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Information</CardTitle>
          <p className="text-sm text-muted-foreground">
            Toggle the visibility of each field to control what event attendees can see.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <ProfileFieldToggle
            icon={<User className="h-4 w-4" />}
            label="Full name"
            visible={true}
            onToggle={() => {}}
            locked
          >
            <p className="text-sm font-medium">{user.name}</p>
          </ProfileFieldToggle>

          <ProfileFieldToggle
            icon={<Building2 className="h-4 w-4" />}
            label="Company"
            visible={visibility.company}
            onToggle={() => setVisibility("company", !visibility.company)}
          >
            <p className="text-sm">
              {user.company ?? <span className="italic text-muted-foreground/60">Not set</span>}
            </p>
          </ProfileFieldToggle>

          <ProfileFieldToggle
            icon={<Briefcase className="h-4 w-4" />}
            label="Title"
            visible={visibility.title}
            onToggle={() => setVisibility("title", !visibility.title)}
          >
            <p className="text-sm">
              {user.title ?? <span className="italic text-muted-foreground/60">Not set</span>}
            </p>
          </ProfileFieldToggle>

          <ProfileFieldToggle
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            visible={visibility.email}
            onToggle={() => setVisibility("email", !visibility.email)}
          >
            <p className="text-sm">{user.email}</p>
          </ProfileFieldToggle>

          <ProfileFieldToggle
            icon={<Globe className="h-4 w-4" />}
            label="LinkedIn"
            visible={visibility.linkedinUrl}
            onToggle={() => setVisibility("linkedinUrl", !visibility.linkedinUrl)}
          >
            <p className="truncate text-sm">
              {user.linkedinUrl ?? (
                <span className="italic text-muted-foreground/60">Not connected</span>
              )}
            </p>
          </ProfileFieldToggle>

          <ProfileFieldToggle
            icon={<Building2 className="h-4 w-4" />}
            label="Industry"
            visible={visibility.industry}
            onToggle={() => setVisibility("industry", !visibility.industry)}
          >
            <p className="text-sm">
              {user.industry ?? <span className="italic text-muted-foreground/60">Not set</span>}
            </p>
          </ProfileFieldToggle>

          <ProfileFieldToggle
            icon={<MapPin className="h-4 w-4" />}
            label="Location"
            visible={visibility.location}
            onToggle={() => setVisibility("location", !visibility.location)}
          >
            <p className="text-sm">
              {user.location ?? <span className="italic text-muted-foreground/60">Not set</span>}
            </p>
          </ProfileFieldToggle>

          {user.skills && user.skills.length > 0 && (
            <div className="rounded-xl border bg-background px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Skills
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {user.skills.map((skill) => (
                  <Badge key={skill} className="bg-muted text-xs text-foreground">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bio */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Bio</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Shown on your attendee card and profile page.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={regenerateBio}
                disabled={generatingBio}
              >
                {generatingBio ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Regenerate
                  </>
                )}
              </Button>
              <button
                onClick={() => setVisibility("bio", !visibility.bio)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                  visibility.bio
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {visibility.bio ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                {visibility.bio ? "Visible" : "Hidden"}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell people what you&apos;re working on and what you&apos;re looking for at this event..."
            className="min-h-[120px] resize-none"
          />
        </CardContent>
      </Card>

      {/* Headline */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Headline</CardTitle>
            <button
              onClick={() => setVisibility("headline", !visibility.headline)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition",
                visibility.headline
                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {visibility.headline ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
              {visibility.headline ? "Visible" : "Hidden"}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <Input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Founder @ Acme · Hiring engineers"
            maxLength={80}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">{headline.length}/80 characters</p>
        </CardContent>
      </Card>

      <Button onClick={save} className="w-full" size="lg">
        {saved ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Saved
          </>
        ) : (
          "Save changes"
        )}
      </Button>
    </div>
  );
}
