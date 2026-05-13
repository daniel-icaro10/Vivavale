"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { updateProfileAction } from "../actions";
import { profileSchema, type ProfileFormData } from "../schemas";
import {
  TIMEZONE_VALUES,
  TIMEZONE_GROUPS,
  type TimezoneValue,
} from "../constants";

type SaveStatus = "idle" | "saving" | "success" | "error";

interface ProfileFormProps {
  name: string;
  timezone: string;
}

// Type guard: verifica se um timezone está na lista suportada
function isSupportedTimezone(tz: string): tz is TimezoneValue {
  return (TIMEZONE_VALUES as ReadonlyArray<string>).includes(tz);
}

// Fallback se o timezone salvo não estiver na lista curada
function resolveTimezone(savedTimezone: string): TimezoneValue {
  return isSupportedTimezone(savedTimezone)
    ? savedTimezone
    : "America/Sao_Paulo";
}

function getTimezoneLabel(value: string): string | undefined {
  for (const group of TIMEZONE_GROUPS) {
    const option = group.options.find((o) => o.value === value);
    if (option) return option.label;
  }
  return undefined;
}

export function ProfileForm({ name, timezone }: ProfileFormProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [browserTzSuggestion, setBrowserTzSuggestion] = useState<
    TimezoneValue | null
  >(null);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);

  const validTimezone = resolveTimezone(timezone);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name,
      timezone: validTimezone,
    },
  });

  // Detectar timezone do browser — apenas como sugestão
  useEffect(() => {
    try {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (
        browserTz &&
        browserTz !== timezone &&
        isSupportedTimezone(browserTz)
      ) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBrowserTzSuggestion(browserTz);
      }
    } catch {
      // Intl API indisponível — ignorar silenciosamente
    }
  }, [timezone]);

  // Auto-limpar feedback de sucesso após 3s
  useEffect(() => {
    if (saveStatus !== "success") return;
    const timer = setTimeout(() => setSaveStatus("idle"), 3000);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const handleAcceptSuggestion = () => {
    if (browserTzSuggestion) {
      setValue("timezone", browserTzSuggestion, { shouldDirty: true });
    }
    setSuggestionDismissed(true);
  };

  const onSubmit = async (data: ProfileFormData) => {
    setSaveStatus("saving");
    setErrorMessage(undefined);
    try {
      const result = await updateProfileAction(data);
      if ("error" in result) {
        setSaveStatus("error");
        setErrorMessage(result.error);
      } else {
        setSaveStatus("success");
      }
    } catch {
      setSaveStatus("error");
      setErrorMessage("Não foi possível salvar. Tente novamente.");
    }
  };

  const showSuggestion =
    browserTzSuggestion !== null && !suggestionDismissed;
  const suggestionLabel = showSuggestion
    ? getTimezoneLabel(browserTzSuggestion!)
    : null;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-6"
      aria-label="Editar perfil"
    >
      {/* Nome */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Nome
        </label>
        <Input
          id="name"
          placeholder="Seu nome"
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          className="h-10"
          {...register("name")}
        />
        {errors.name && (
          <p id="name-error" role="alert" className="text-xs text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      {/* Fuso horário */}
      <div className="space-y-2">
        <label
          htmlFor="timezone"
          className="text-sm font-medium text-foreground"
        >
          Fuso horário
        </label>
        <p className="text-xs text-muted-foreground">
          Os lembretes de medicação usam seu horário local.
        </p>

        <select
          id="timezone"
          aria-invalid={!!errors.timezone}
          aria-describedby="timezone-note"
          className={cn(
            "h-10 w-full rounded-md border border-input bg-background px-3 text-base md:text-sm",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          )}
          {...register("timezone")}
        >
          {TIMEZONE_GROUPS.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {errors.timezone && (
          <p role="alert" className="text-xs text-destructive">
            {errors.timezone.message}
          </p>
        )}

        <p
          id="timezone-note"
          className="text-xs leading-relaxed text-muted-foreground"
        >
          Lembretes já criados continuam com o horário original. Novos
          lembretes usarão o fuso selecionado.
        </p>
      </div>

      {/* Sugestão de timezone do browser */}
      {showSuggestion && suggestionLabel && (
        <div
          className="rounded-lg border border-border bg-muted/40 px-3.5 py-3"
          role="note"
          aria-label="Sugestão de fuso horário"
        >
          <p className="text-xs leading-relaxed text-foreground">
            Detectamos que você está em{" "}
            <span className="font-medium">{suggestionLabel}</span>. Quer usar
            esse fuso horário?
          </p>
          <div className="mt-2.5 flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 text-xs"
              onClick={handleAcceptSuggestion}
            >
              Usar este fuso
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-9 text-xs text-muted-foreground"
              onClick={() => setSuggestionDismissed(true)}
            >
              Ignorar
            </Button>
          </div>
        </div>
      )}

      {/* Feedback de salvamento */}
      <div
        className={cn(
          "min-h-10 transition-opacity duration-200",
          saveStatus === "idle" ? "opacity-0" : "opacity-100",
        )}
        aria-live="polite"
        aria-atomic="true"
      >
        {saveStatus === "saving" && (
          <p className="py-2.5 text-center text-sm text-muted-foreground">
            Salvando...
          </p>
        )}
        {saveStatus === "success" && (
          <p className="rounded-lg bg-accent/25 px-3 py-2.5 text-center text-sm font-medium text-accent-foreground">
            Salvo.
          </p>
        )}
        {saveStatus === "error" && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 px-3 py-2.5 text-center text-sm text-destructive"
          >
            {errorMessage ?? "Não foi possível salvar. Tente novamente."}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="h-11 w-full">
        {isSubmitting ? (
          <>
            <Spinner />
            Salvando...
          </>
        ) : (
          "Salvar alterações"
        )}
      </Button>
    </form>
  );
}
