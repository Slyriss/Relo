"use client";

import { useRef, useState } from "react";
import { ImageUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";

export function ProfilePhotoUploader({ ownerId }: { ownerId: string }) {
  const updateUser = useAppStore((state) => state.updateUser);
  const inputRef = useRef<HTMLInputElement>(null);
  const [consent, setConsent] = useState(false);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setStatus("error");
      setMessage("Choose a photo first.");
      return;
    }
    if (!consent) {
      setStatus("error");
      setMessage("Confirm you have permission to use this photo.");
      return;
    }

    setStatus("saving");
    setMessage("");
    const body = new FormData();
    body.set("photo", file);
    body.set("ownerType", "user");
    body.set("ownerId", ownerId);
    body.set("consent", "true");

    try {
      const response = await fetch("/api/profile-photo/upload", { method: "POST", body });
      const data = (await response.json()) as { photoUrl?: string; error?: string };
      if (!response.ok || !data.photoUrl) throw new Error(data.error ?? "Could not upload profile photo.");
      updateUser({ photoUrl: data.photoUrl });
      setStatus("saved");
      setMessage("Profile photo uploaded.");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not upload profile photo.");
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/25 p-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(event) => {
            setFileName(event.target.files?.[0]?.name ?? "");
            setStatus("idle");
            setMessage("");
          }}
          className="file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium"
        />
        <Button type="button" onClick={upload} disabled={status === "saving" || !fileName}>
          {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
          Upload
        </Button>
      </div>
      <label className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border"
        />
        <span>I confirm I have the right to upload and use this photo for my Relo profile.</span>
      </label>
      {message ? (
        <p className={status === "error" ? "text-sm font-medium text-destructive" : "text-sm font-medium text-emerald-600"}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
