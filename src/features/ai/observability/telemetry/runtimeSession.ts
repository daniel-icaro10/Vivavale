import { randomUUID } from "crypto";

/** Gerado uma vez por processo. Agrupa todos os eventos da instância de servidor. */
export const SESSION_ID: string = randomUUID();
