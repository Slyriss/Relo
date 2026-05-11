"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { parseAttendeeCsv } from "@/lib/csv";
import { useAppStore } from "@/lib/store";

export function CsvUploadDropzone({ eventId }: { eventId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const addAttendees = useAppStore((state) => state.addAttendees);
  const [message, setMessage] = useState("Drop a CSV or choose a file.");

  async function handleFile(file: File) {
    const text = await file.text();
    const result = parseAttendeeCsv(text, eventId);
    if (result.attendees.length) addAttendees(result.attendees);
    setMessage(
      `${result.attendees.length} attendees imported${
        result.errors.length ? `, ${result.errors.length} rows need review` : ""
      }.`
    );
  }

  return (
    <Card
      className="border-dashed"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) void handleFile(file);
      }}
    >
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold">Import attendees</div>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <Button variant="outline" onClick={() => inputRef.current?.click()}>
          Choose CSV
        </Button>
      </CardContent>
    </Card>
  );
}
