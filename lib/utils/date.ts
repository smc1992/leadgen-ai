import { format } from "date-fns"

/**
 * Formatiert ein Datum konsistent für Server und Client
 * Verhindert Hydration-Fehler durch einheitliches Format
 */
export function formatDate(date: string | Date, formatStr: string = "MMM dd, yyyy"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return format(dateObj, formatStr)
}

/**
 * Formatiert ein Datum im kurzen Format (z.B. "Oct 25, 2025")
 */
export function formatDateShort(date: string | Date): string {
  return formatDate(date, "MMM dd, yyyy")
}

/**
 * Formatiert ein Datum im langen Format (z.B. "Friday, November 1, 2025")
 */
export function formatDateLong(date: string | Date): string {
  return formatDate(date, "EEEE, MMMM d, yyyy")
}

/**
 * Formatiert ein Datum mit Zeit (z.B. "Oct 25, 2025 at 2:30 PM")
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, "MMM dd, yyyy 'at' h:mm a")
}

/**
 * Formatiert ein Datum relativ (z.B. "2 days ago")
 */
export function formatRelativeDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffInMs = now.getTime() - dateObj.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return "Today"
  if (diffInDays === 1) return "Yesterday"
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}
