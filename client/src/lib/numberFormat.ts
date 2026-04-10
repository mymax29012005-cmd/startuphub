export function stripNonDigits(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function formatDigitsWithSpaces(digits: string) {
  if (!digits) return "";
  // Add spaces every 3 digits from the end.
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

