/**
 * scheduling.ts — Utilitários timezone-safe para o sistema de reminders.
 *
 * Princípios:
 *   - Toda computação usa apenas APIs built-in do JavaScript (Intl).
 *   - Nenhuma lib externa de timezone é necessária.
 *   - DST é tratado via loop de verificação sobre Intl.DateTimeFormat.
 *   - O resultado final é sempre um Date UTC válido.
 *
 * Limitações conhecidas:
 *   - Durante o "fall back" do DST (relógio volta 1h, ex: 02:30 existe duas vezes),
 *     a função resolve para a PRIMEIRA ocorrência. Para lembretes de wellness,
 *     esta ambiguidade é aceitável (máximo 1h de diferença, 1× por ano).
 *   - weekdays: o dia de corte é calculado no timezone do lembrete, não do servidor.
 *     Cruzamentos de meia-noite (ex: sexta 23h no Brazil = sábado UTC) são
 *     corretamente tratados porque getLocalDOW usa o UTC resultante no timezone local.
 */

/** Extrai hora e minuto de uma Date UTC interpretada no timezone informado. */
function getLocalHM(utc: Date, timezone: string): { h: number; m: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(utc);

  return {
    h: parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10),
    m: parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10),
  };
}

/** Extrai ano, mês (1-indexed) e dia de uma Date UTC no timezone informado. */
function getLocalYMD(
  utc: Date,
  timezone: string,
): { y: number; mo: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(utc);

  return {
    y: parseInt(parts.find((p) => p.type === "year")?.value ?? "2000", 10),
    mo: parseInt(parts.find((p) => p.type === "month")?.value ?? "1", 10),
    d: parseInt(parts.find((p) => p.type === "day")?.value ?? "1", 10),
  };
}

/**
 * Converte uma data local (y/mo/d HH:MM no timezone informado) para UTC.
 *
 * Algoritmo:
 *   1. Cria um "seed UTC" tratando os componentes locais como se fossem UTC.
 *   2. Verifica o offset real do timezone naquele instante via Intl.
 *   3. Corrige o seed pelo offset encontrado.
 *   4. Verifica a correção (lida com DST onde o offset muda durante a correção).
 */
function localToUtc(
  y: number,
  mo: number,
  d: number,
  h: number,
  m: number,
  timezone: string,
): Date {
  // Passo 1: seed — trata componentes locais como UTC (ignora offset)
  const seed = new Date(Date.UTC(y, mo - 1, d, h, m, 0));

  // Passo 2: descobre o offset real naquele instante
  const { h: localH, m: localM } = getLocalHM(seed, timezone);

  // Passo 3: calcula a correção necessária em minutos
  let shiftMin = (h - localH) * 60 + (m - localM);

  // Normaliza o shift para evitar saltos de > 12h (cruzamento de meia-noite)
  if (shiftMin > 720) shiftMin -= 1440;
  if (shiftMin < -720) shiftMin += 1440;

  const result = new Date(seed.getTime() + shiftMin * 60_000);

  // Passo 4: verificação — necessária quando o próprio shift cruza uma mudança de DST
  const { h: checkH, m: checkM } = getLocalHM(result, timezone);
  if (checkH !== h || checkM !== m) {
    // DST "spring forward": tenta ±1h
    for (const adj of [60, -60]) {
      const candidate = new Date(result.getTime() + adj * 60_000);
      const { h: ah, m: am } = getLocalHM(candidate, timezone);
      if (ah === h && am === m) return candidate;
    }
    // Se ainda não convergiu: retorna a melhor aproximação.
    // Isso só ocorre durante a hora "pulada" do spring-forward (≤ 1h de erro, 1× por ano).
  }

  return result;
}

/**
 * Retorna o dia da semana (0=Dom, 1=Seg, ..., 6=Sáb) de uma Date UTC
 * interpretada no timezone informado.
 *
 * Usa o campo "weekday" do Intl.DateTimeFormat para garantir que o dia
 * reflete a data LOCAL do usuário, não a data UTC do servidor.
 */
function getLocalDOW(utc: Date, timezone: string): number {
  // "narrow" dá Mon/Tue/Wed/Thu/Fri/Sat/Sun em locale en-US
  const narrow = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  }).format(utc);

  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return map[narrow] ?? 1;
}

/** Verifica se um dia da semana (0–6) é dia útil (segunda=1 a sexta=5). */
function isWeekday(dow: number): boolean {
  return dow >= 1 && dow <= 5;
}

/**
 * Avança uma data UTC em N dias inteiros (00:00 UTC do dia seguinte).
 * Retorna o ponto de referência meia-noite UTC para o dia-alvo.
 */
function addDays(utc: Date, days: number): Date {
  return new Date(utc.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Calcula o próximo UTC em que um reminder deve disparar,
 * respeitando a recurrence (daily | weekdays).
 *
 * @param timeLocal  - Horário local no formato "HH:MM"
 * @param timezone   - IANA timezone (ex: "America/Sao_Paulo")
 * @param recurrence - "daily" | "weekdays" (padrão: "daily")
 * @param from       - Referência UTC (padrão: agora)
 * @returns          - Date UTC do próximo disparo
 *
 * Algoritmo:
 *   1. Tenta hoje no timezone do usuário.
 *   2. Se o horário já passou OU o dia não é válido para a recurrence,
 *      avança um dia por vez (máximo 7 tentativas) até encontrar um dia válido.
 *   3. Para weekdays, pula sábado (6) e domingo (0) automaticamente.
 *
 * Exemplos weekdays:
 *   - Sexta 23:00 (passou): próximo = segunda-feira
 *   - Sábado qualquer hora:  próximo = segunda-feira
 *   - Domingo qualquer hora: próximo = segunda-feira
 */
export function computeNextTriggerAt(
  timeLocal: string,
  timezone: string,
  recurrence: "daily" | "weekdays" = "daily",
  from: Date = new Date(),
): Date {
  const [h, m] = timeLocal.split(":").map(Number);

  // Data local de referência no timezone do usuário
  const { y, mo, d } = getLocalYMD(from, timezone);

  // Candidato para hoje
  const todayUtc = localToUtc(y, mo, d, h, m, timezone);
  const todayDow = getLocalDOW(todayUtc, timezone);

  if (todayUtc > from && (recurrence === "daily" || isWeekday(todayDow))) {
    return todayUtc;
  }

  // Avança dia a dia até encontrar um slot válido (máximo 7 dias = garante semana inteira)
  for (let i = 1; i <= 7; i++) {
    const nextSeed = addDays(new Date(Date.UTC(y, mo - 1, d, 0, 0, 0)), i);
    const { y: ny, mo: nmo, d: nd } = getLocalYMD(nextSeed, timezone);
    const candidate = localToUtc(ny, nmo, nd, h, m, timezone);
    const dow = getLocalDOW(candidate, timezone);

    if (recurrence === "daily" || isWeekday(dow)) {
      return candidate;
    }
  }

  // Fallback de segurança — nunca deve ser atingido para daily/weekdays
  const fallbackSeed = addDays(new Date(Date.UTC(y, mo - 1, d, 0, 0, 0)), 1);
  const { y: fy, mo: fmo, d: fd } = getLocalYMD(fallbackSeed, timezone);
  return localToUtc(fy, fmo, fd, h, m, timezone);
}

/**
 * Valida se uma string é um IANA timezone reconhecido pelo ambiente.
 * Usa Intl.DateTimeFormat como validador — sem lookup de lista estática.
 */
export function isValidIANATimezone(tz: string): boolean {
  if (!tz || tz.length < 3) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Normaliza o output do PostgreSQL `time` para "HH:MM".
 * O Supabase retorna colunas time como "HH:MM:SS" — remove os segundos.
 */
export function normalizeTimeLocal(raw: string): string {
  return raw.slice(0, 5); // "08:00:00" → "08:00"
}

/**
 * Formata "HH:MM" para exibição humanizada em português.
 * "08:00" → "08h00" | "14:30" → "14h30"
 */
export function formatTimeDisplay(timeLocal: string): string {
  const normalized = normalizeTimeLocal(timeLocal);
  const [h, m] = normalized.split(":");
  return `${h}h${m}`;
}
