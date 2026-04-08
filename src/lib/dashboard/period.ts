export type Period = "today" | "7d" | "30d"

const VALID_PERIODS: Period[] = ["today", "7d", "30d"]

export function parsePeriod(raw: string | null | undefined): Period {
  if (raw && VALID_PERIODS.includes(raw as Period)) return raw as Period
  return "7d"
}

export interface PeriodRange {
  from: Date
  to: Date
  previousFrom: Date
  previousTo: Date
}

export function getPeriodRange(period: Period): PeriodRange {
  const now = new Date()
  const to = now

  if (period === "today") {
    const from = new Date(now)
    from.setUTCHours(0, 0, 0, 0)

    const previousTo = new Date(from)
    previousTo.setUTCMilliseconds(-1)
    const previousFrom = new Date(previousTo)
    previousFrom.setUTCHours(0, 0, 0, 0)

    return { from, to, previousFrom, previousTo }
  }

  const days = period === "7d" ? 7 : 30
  const from = new Date(now)
  from.setUTCDate(from.getUTCDate() - days)
  from.setUTCHours(0, 0, 0, 0)

  const previousTo = new Date(from)
  previousTo.setUTCMilliseconds(-1)
  const previousFrom = new Date(previousTo)
  previousFrom.setUTCDate(previousFrom.getUTCDate() - days)
  previousFrom.setUTCHours(0, 0, 0, 0)

  return { from, to, previousFrom, previousTo }
}
