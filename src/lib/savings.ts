export interface SavingsPlanInput {
  targetAmount: number
  initialAmount: number
  currentAge: number
  targetAge: number
  etfEnabled: boolean
  etfAnnualReturn: number // in percent, e.g. 7 for 7 % p.a.
}

export interface SavingsPlanResult {
  months: number
  /** Monatliche Sparrate ohne Rendite (reines Sparen) */
  monthlyWithoutReturn: number
  /** Monatliche Sparrate mit ETF-Rendite (falls aktiviert) */
  monthlyWithReturn: number | null
  /** Summe der Einzahlungen über die Laufzeit (mit ETF-Rate, sonst ohne) */
  totalContributions: number
  /** Erwarteter Kapitalertrag durch die ETF-Rendite */
  expectedGains: number | null
}

/**
 * Berechnet die nötige monatliche Sparrate, um ein Zielvermögen zu erreichen.
 * Mit ETF wird der Sparplan als nachschüssige Rente mit monatlicher
 * Verzinsung gerechnet: FV = P·(1+r)^n + M·((1+r)^n − 1)/r
 */
export function calculateSavingsPlan(input: SavingsPlanInput): SavingsPlanResult | null {
  const months = (input.targetAge - input.currentAge) * 12
  if (months <= 0 || input.targetAmount <= 0) return null

  const gap = Math.max(0, input.targetAmount - input.initialAmount)
  const monthlyWithoutReturn = gap / months

  let monthlyWithReturn: number | null = null
  let expectedGains: number | null = null

  if (input.etfEnabled && input.etfAnnualReturn > 0) {
    const r = input.etfAnnualReturn / 100 / 12
    const growth = Math.pow(1 + r, months)
    const needed = input.targetAmount - input.initialAmount * growth
    monthlyWithReturn = needed <= 0 ? 0 : (needed * r) / (growth - 1)
    expectedGains =
      input.targetAmount - input.initialAmount - monthlyWithReturn * months
  }

  const rate = monthlyWithReturn ?? monthlyWithoutReturn
  return {
    months,
    monthlyWithoutReturn,
    monthlyWithReturn,
    totalContributions: rate * months,
    expectedGains,
  }
}
