interface MemoryThreadProps {
  narrative: string;
}

export function MemoryThread({ narrative }: MemoryThreadProps) {
  return (
    <p
      className="text-[12px] leading-relaxed text-muted-foreground/22 max-w-[38ch] animate-in fade-in-0 duration-600"
      style={{ letterSpacing: "-0.002em" }}
      aria-hidden="true"
    >
      {narrative}
    </p>
  );
}
