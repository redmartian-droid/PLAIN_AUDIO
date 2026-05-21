export const PLANS = {
  free: {
    name: "Free",
    dailyLimit: 3,
    maxFileSizeMB: 25,
    features: [
      "3 transcriptions/day",
      "25MB file limit",
      "Basic export (TXT)",
      "7-day storage",
    ],
  },
  pro: {
    name: "Pro",
    dailyLimit: Infinity,
    maxFileSizeMB: 500,
    features: [
      "Unlimited transcriptions",
      "500MB file limit",
      "All export formats (TXT, SRT, PDF)",
      "Speaker diarization",
      "AI summaries",
      "Permanent storage",
      "Priority processing",
    ],
    priceMonthly: 12,
    priceAnnual: 99,
  },
} as const;

export type Plan = keyof typeof PLANS;

export function getPolarCheckoutUrl(productId: string): string {
  return `https://polar.sh/checkout?product_id=${productId}`;
}
