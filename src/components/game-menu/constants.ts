import type { ResolutionScale } from "../../context/settings-context";

export const THAI_TRANSLATIONS = [
  "ผลไม้และผัก", // Fruits & Vegetables
  "สนุกกับการนับ", // Counting Fun
  "รูปร่างและสี", // Shapes & Colors
  "สัตว์และธรรมชาติ", // Animals & Nature
  "ยานพาหนะ", // Things That Go
  "สภาพอากาศ", // Weather Wonders
  "ความรู้สึกและการกระทำ", // Feelings & Actions
  "ส่วนต่างๆของร่างกาย", // Body Parts
  "ความท้าทายด้วยตัวอักษร", // Alphabet Challenge
];

export const LEVEL_ICON_FALLBACKS = [
  "🍎",
  "1️⃣",
  "🎨",
  "🦁",
  "🚗",
  "🌤️",
  "😄",
  "🖐️",
  "🅰️",
];

export const DISPLAY_SCALE_OPTIONS = [
  { id: "auto", label: "Auto" },
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
] satisfies Array<{ id: ResolutionScale; label: string }>;

export const MENU_THAI_LABELS = {
  playAllLevels: "โหมดชาเลนจ์",
  levelSelect: "เลือกระดับ",
};
