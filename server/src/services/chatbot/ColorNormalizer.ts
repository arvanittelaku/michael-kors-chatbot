const COLOR_MAP: Record<string, string[]> = {
  black: ['black', 'zi', 'e zezë', 'zeze', 'e zeza', 'blak', 'butter black'],
  white: ['white', 'bardhë', 'e bardhë', 'bardha', 'barde'],
  red: ['red', 'kuqe', 'kuq', 'kirmizi', 'kırmızı', 'dark red', 'light red', 'garnet'],
  coral: ['coral', 'koral'],
  pink: ['pink', 'rozë', 'roze', 'e rozë'],
  blue: ['blue', 'blu', 'kaltër', 'e kaltër', 'e blertë', 'light blue', 'navy', 'dark blue', 'light/pastel blue', 'open blue'],
  yellow: ['yellow', 'verdhë', 'e verdhë', 'e verdha'],
  green: ['green', 'gjelbër', 'e gjelbër', 'gjelber', 'lime', 'dark green'],
  beige: ['beige', 'bej', 'bejë', 'cream beige'],
  brown: ['brown', 'kafe', 'e kafe', 'chocolate'],
  gray: ['gray', 'gri', 'e gri', 'silver', 'ash', 'pluhur', 'medium grey'],
  orange: ['orange', 'portokalli', 'e portokalltë'],
  purple: ['purple', 'vjollcë', 'e purpurtë', 'lila'],
  cream: ['cream', 'krem', 'bej e çelët'],
  gold: ['gold', 'ari', 'artë', 'e artë'],
  silver: ['silver', 'argjendtë', 'e argjendtë'],
};

export function normalizeColor(input: string): string | null {
  if (!input) return null;
  
  const lowerInput = input.toLowerCase().trim();
  
  // Check for manufacturer codes first - these should not be normalized
  if (/^[a-z]\d+$/.test(lowerInput) || /^[a-z]{2}\d+$/.test(lowerInput)) {
    return null;
  }
  
  for (const [canonical, variants] of Object.entries(COLOR_MAP)) {
    if (variants.includes(lowerInput)) return canonical;
  }
  return null;
}
