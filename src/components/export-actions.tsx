"use client";

import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportActions({
  csv,
  filename,
  pdfLabel = "Export PDF"
}: {
  csv: string;
  filename: string;
  pdfLabel?: string;
}) {
  function downloadCsv() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button variant="outline" onClick={downloadCsv}>
        <Download className="h-4 w-4" />
        Export CSV
      </Button>
      <Button variant="outline" onClick={() => window.print()}>
        <FileText className="h-4 w-4" />
        {pdfLabel}
      </Button>
    </div>
  );
}
