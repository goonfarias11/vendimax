/**
 * Alias ARCA para el cliente legacy de AFIP.
 * Mantiene compatibilidad mientras se completa la migracion de nombres.
 */

export { AfipClient as ArcaClient, createAfipClient as createArcaClient } from "@/lib/afip/client"
export * from "@/lib/afip/client"
