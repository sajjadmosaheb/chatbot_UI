// Basic check for common RTL character ranges (Arabic, Persian, Urdu, Hebrew)
// Arabic: U+0600 to U+06FF
// Hebrew: U+0590 to U+05FF
// Persian/Urdu may use Arabic script characters.
const rtlRegex = /[\u0600-\u06FF\u0590-\u05FF]/;

export function getTextDirection(text: string): 'rtl' | 'ltr' {
  if (rtlRegex.test(text)) {
    return 'rtl';
  }
  return 'ltr';
}
