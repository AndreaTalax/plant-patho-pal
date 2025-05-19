
/**
 * Format a number as a percentage
 * @param value The number to format
 * @param digits Number of decimal digits to include
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, digits: number = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

/**
 * Format a confidence score to be more human readable
 * @param score Confidence score between 0-1
 * @returns Human readable description
 */
export function formatConfidence(score: number): string {
  if (score >= 0.9) return 'Very High';
  if (score >= 0.75) return 'High';
  if (score >= 0.5) return 'Moderate';
  if (score >= 0.3) return 'Low';
  return 'Very Low';
}
