interface MemoryEchoProps {
  narrative: string;
}

export function MemoryEcho({ narrative }: MemoryEchoProps) {
  return (
    <p
      className="text-[13px] leading-relaxed text-muted-foreground/30 max-w-[38ch]"
      style={{ letterSpacing: "-0.003em" }}
      aria-hidden="true"
    >
      {narrative}
    </p>
  );
}
