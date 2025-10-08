const COLOR_MAP: Record<string, string[]> = {
  black: ['black', 'zi', 'e zezë', 'zeze', 'e zeza', 'blak', 'butter black', 'jet black', 'charcoal black', 'midnight black'],
  white: ['white', 'bardhë', 'e bardhë', 'bardha', 'barde', 'ivory white', 'pearl white', 'cream white'],
  red: ['red', 'kuqe', 'kuq', 'kirmizi', 'kırmızı', 'dark red', 'light red', 'garnet', 'crimson red', 'scarlet red', 'burgundy red'],
  coral: ['coral', 'koral'],
  pink: ['pink', 'rozë', 'roze', 'e rozë'],
  blue: ['blue', 'blu', 'kaltër', 'e kaltër', 'e blertë', 'light blue', 'navy', 'dark blue', 'light/pastel blue', 'open blue', 'navy blue', 'royal blue', 'sky blue'],
  yellow: ['yellow', 'verdhë', 'e verdhë', 'e verdha'],
  green: ['green', 'gjelbër', 'e gjelbër', 'gjelber', 'lime', 'dark green', 'forest green', 'emerald green', 'lime green'],
  beige: ['beige', 'bej', 'bejë', 'cream beige', 'champagne', 'nude'],
  brown: ['brown', 'kafe', 'e kafe', 'chocolate', 'tan', 'camel'],
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
  if (/^[a-z]\d+$/.test(lowerInput) || /^[a-z]{2}\d+$/.test(lowerInput) || /^\d+$/.test(lowerInput)) {
    return null;
  }
  
  for (const [canonical, variants] of Object.entries(COLOR_MAP)) {
    if (variants.includes(lowerInput)) return canonical;
  }
  return null;
}
