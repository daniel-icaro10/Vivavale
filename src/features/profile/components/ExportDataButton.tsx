"use client";

export function ExportDataButton() {
  return (
    <a
      href="/api/export"
      download
      className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      Baixar meus dados (JSON)
    </a>
  );
}
