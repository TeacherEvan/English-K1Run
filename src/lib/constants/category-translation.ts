export const CATEGORY_TRANSLATION_KEYS: Record<string, string> = {
  "Fruits & Vegetables": "fruits",
  "Counting Fun": "counting",
  "Shapes & Colors": "shapes",
  "Animals & Nature": "animals",
  "Things That Go": "things",
  "Weather Wonders": "weather",
  "Feelings & Actions": "feelings",
  "Body Parts": "body",
  "Alphabet Challenge": "alphabet",
};

export const getCategoryTranslationKey = (name: string) =>
  CATEGORY_TRANSLATION_KEYS[name];
