/** Mínimo de logs na semana para calcular correlações */
export const MIN_LOGS_FOR_CORRELATION = 7;

/** Diferença mínima entre médias de duas dimensões para considerar correlação relevante */
export const MIN_CORRELATION_DIFF = 1.5;

/** Coeficiente de correlação (Pearson) acima do qual consideramos correlação forte */
export const CORRELATION_THRESHOLD_STRONG = 0.6;

/** Coeficiente de correlação acima do qual consideramos correlação moderada */
export const CORRELATION_THRESHOLD_MODERATE = 0.4;

/** Quantos registros buscar por página no timeline */
export const TIMELINE_PAGE_SIZE = 42; // ~6 semanas

/** Variação mínima de média entre semanas para considerar tendência (não "estável") */
export const TREND_MIN_DELTA = 0.5;
