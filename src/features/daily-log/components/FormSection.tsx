interface FormSectionProps {
  children: React.ReactNode;
}

export function FormSection({ children }: FormSectionProps) {
  return <div className="space-y-2">{children}</div>;
}
