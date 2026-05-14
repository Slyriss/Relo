"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { initials, cn } from "@/lib/utils";

export function ProfileAvatar({
  name,
  photoUrl,
  className,
  imageClassName,
  style,
}: {
  name: string;
  photoUrl?: string;
  className?: string;
  imageClassName?: string;
  style?: CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = photoUrl && !failed;

  return (
    <div className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted font-semibold", className)} style={style}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={`${name} profile photo`}
          className={cn("h-full w-full object-cover", imageClassName)}
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.style.display = "none";
            setFailed(true);
          }}
        />
      ) : null}
      <span className={cn(showImage && "sr-only")}>{initials(name)}</span>
    </div>
  );
}
