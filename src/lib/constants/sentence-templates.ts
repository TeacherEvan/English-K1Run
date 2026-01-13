import type { SupportedLanguage } from "./language-config";
import { DEFAULT_LANGUAGE } from "./language-config";

/**
 * Educational sentence templates for audio pronunciation
 * Multi-language support for 6 languages: en, fr, ja, th, zh-CN, zh-HK
 */

// English sentence templates
const ENGLISH_SENTENCE_TEMPLATES: Record<string, string> = {
  // Fruits & Vegetables
  apple: "I eat a red apple",
  banana: "The banana is yellow and sweet",
  grapes: "I love purple grapes",
  strawberry: "The strawberry is red and juicy",
  carrot: "The carrot is crunchy and orange",
  cucumber: "The cucumber is cool and green",
  watermelon: "The watermelon is big and juicy",
  broccoli: "I eat healthy broccoli",
  orange: "The orange is round and juicy",
  lemon: "The lemon is sour and yellow",
  peach: "The peach is soft and sweet",
  cherry: "The cherry is small and red",
  kiwi: "The kiwi is fuzzy and green",

  // Counting (1-15)
  "1": "One",
  "2": "Two",
  "3": "Three",
  "4": "Four",
  "5": "Five",
  "6": "Six",
  "7": "Seven",
  "8": "Eight",
  "9": "Nine",
  "10": "Ten",
  "11": "Eleven",
  "12": "Twelve",
  "13": "Thirteen",
  "14": "Fourteen",
  "15": "Fifteen",

  // Shapes & Colors
  circle: "The circle is round",
  square: "The square has four sides",
  diamond: "The diamond is shiny",
  triangle: "The triangle has three sides",
  star: "The star shines bright",
  oval: "The oval is like an egg",
  rectangle: "The rectangle is long",
  pentagon: "The pentagon has five sides",
  hexagon: "The hexagon has six sides",
  blue: "The sky is blue",
  red: "The apple is red",
  // Note: 'orange' color uses the fruit definition from above
  green: "The grass is green",
  purple: "The grapes are purple",
  white: "The snow is white",
  black: "The night is black",
  brown: "The tree is brown",
  pink: "The flower is pink",
  yellow: "The sun is yellow",

  // Animals & Nature
  dog: "The dog says woof",
  cat: "The cat says meow",
  fox: "The fox is clever",
  turtle: "The turtle moves slowly",
  butterfly: "The butterfly is beautiful",
  owl: "The owl says hoot",
  ant: "The ant is small and strong",
  duck: "The duck says quack",
  elephant: "The elephant is big",
  fish: "The fish swims in water",
  giraffe: "The giraffe has a long neck",
  penguin: "The penguin waddles on ice",

  // Things That Go
  car: "The car drives on the road",
  bus: "The yellow bus takes us to school",
  "fire truck": "The fire truck has a loud siren",
  airplane: "The airplane flies in the sky",
  rocket: "The rocket goes to space",
  bicycle: "I ride my bicycle to the park",
  helicopter: "The helicopter goes up and down",
  boat: "The boat floats on the water",
  train: "The train goes on the tracks",
  taxi: "The taxi takes people places",
  van: "The van carries our family",
  scooter: "I ride my scooter fast",
  motorcycle: "The motorcycle goes zoom",

  // Weather Wonders
  sunny: "It is sunny today",
  cloudy: "The sky is cloudy",
  rainy: "It is rainy outside",
  stormy: "The weather is stormy",
  snowy: "It is snowy and cold",
  rainbow: "I see a beautiful rainbow",
  tornado: "The tornado spins around",
  windy: "It is very windy today",
  moon: "The moon shines at night",
  sun: "The sun gives us light",
  foggy: "The morning is foggy",
  lightning: "The lightning flashes bright",

  // Feelings & Actions
  happy: "I feel happy and smile",
  sad: "When I am sad I might cry",
  angry: "Take a breath when you feel angry",
  sleepy: "I am sleepy and yawn",
  hug: "Give me a big hug",
  clap: "Clap your hands together",
  dance: "Let's dance to the music",
  flip: "Watch me flip and spin",
  smile: "I smile when I am happy",
  laugh: "I laugh at funny jokes",
  think: "I think before I speak",
  celebrate: "Let's celebrate together",
  wave: "I wave hello to my friends",

  // Body Parts
  eye: "I see with my eyes",
  ear: "I hear with my ears",
  nose: "I smell with my nose",
  mouth: "I talk with my mouth",
  tongue: "My tongue tastes food",
  hand: "I wave my hand hello",
  foot: "I walk with my feet",
  leg: "I jump with my legs",
  tooth: "I brush my teeth",
  arm: "I swing my arms",
  brain: "My brain helps me think",
  heart: "My heart beats in my chest",

  // Alphabet (letters A-Z)
  a: "A is for Apple",
  b: "B is for Ball",
  c: "C is for Cat",
  d: "D is for Dog",
  e: "E is for Elephant",
  f: "F is for Fish",
  g: "G is for Giraffe",
  h: "H is for House",
  i: "I is for Ice cream",
  j: "J is for Juice",
  k: "K is for Kite",
  l: "L is for Lion",
  m: "M is for Moon",
  n: "N is for Nest",
  o: "O is for Orange",
  p: "P is for Penguin",
  q: "Q is for Queen",
  r: "R is for Rainbow",
  s: "S is for Star",
  t: "T is for Tree",
  u: "U is for Umbrella",
  v: "V is for Van",
  w: "W is for Watermelon",
  x: "X is for X-ray",
  y: "Y is for Yellow",
  z: "Z is for Zebra",
};

// French sentence templates
const FRENCH_SENTENCE_TEMPLATES: Record<string, string> = {
  // Fruits & Vegetables
  apple: "Je mange une pomme rouge",
  banana: "La banane est jaune et sucrée",
  grapes: "J'adore les raisins violets",
  strawberry: "La fraise est rouge et juteuse",
  carrot: "La carotte est croquante et orange",
  cucumber: "Le concombre est frais et vert",
  watermelon: "La pastèque est grande et juteuse",
  broccoli: "Je mange du brocoli sain",
  orange: "L'orange est ronde et juteuse",
  lemon: "Le citron est acide et jaune",
  peach: "La pêche est douce et sucrée",
  cherry: "La cerise est petite et rouge",
  kiwi: "Le kiwi est poilu et vert",

  // Counting (1-15)
  one: "Un",
  two: "Deux",
  three: "Trois",
  four: "Quatre",
  five: "Cinq",
  six: "Six",
  seven: "Sept",
  eight: "Huit",
  nine: "Neuf",
  ten: "Dix",

  // Shapes & Colors
  circle: "Le cercle est rond",
  triangle: "Le triangle a trois côtés",
  star: "L'étoile brille",
  blue: "Le ciel est bleu",
  red: "La pomme est rouge",
  green: "L'herbe est verte",
  purple: "Les raisins sont violets",
  yellow: "Le soleil est jaune",

  // Animals & Nature
  dog: "Le chien fait wouf",
  cat: "Le chat fait miaou",
  fox: "Le renard est intelligent",
  turtle: "La tortue se déplace lentement",
  butterfly: "Le papillon est beau",
  tree: "L'arbre est grand",
  flower: "La fleur est jolie",
  elephant: "L'éléphant est grand",
  lion: "Le lion rugit",
  rabbit: "Le lapin saute",
  giraffe: "La girafe a un long cou",
  penguin: "Le pingouin se dandine sur la glace",

  // Things That Go
  car: "La voiture roule sur la route",
  bus: "Le bus jaune nous emmène à l'école",
  "fire truck": "Le camion de pompiers a une sirène forte",
  airplane: "L'avion vole dans le ciel",
  rocket: "La fusée va dans l'espace",
  bicycle: "Je fais du vélo au parc",
  helicopter: "L'hélicoptère monte et descend",
  boat: "Le bateau flotte sur l'eau",
  train: "Le train roule sur les rails",
  taxi: "Le taxi transporte les gens",
  van: "Le van transporte notre famille",
  scooter: "Je roule vite sur ma trottinette",
  motorcycle: "La moto fait vroum",

  // Weather
  sunny: "Il fait beau aujourd'hui",
  cloudy: "Le ciel est nuageux",
  rainy: "Il pleut dehors",
  rainbow: "Je vois un bel arc-en-ciel",
  moon: "La lune brille la nuit",
  sun: "Le soleil nous donne de la lumière",

  // Alphabet
  a: "A comme Avion",
  b: "B comme Ballon",
  c: "C comme Chat",
  d: "D comme Dauphin",
  e: "E comme Éléphant",
  f: "F comme Fleur",
  g: "G comme Girafe",
  h: "H comme Hélicoptère",
  i: "I comme Igloo",
  j: "J comme Jus",
  k: "K comme Koala",
  l: "L comme Lion",
  m: "M comme Maison",
  n: "N comme Nid",
  o: "O comme Orange",
  p: "P comme Pingouin",
  q: "Q comme Quatre",
  r: "R comme Arc-en-ciel",
  s: "S comme Soleil",
  t: "T comme Tortue",
  u: "U comme Ours",
  v: "V comme Van",
  w: "W comme Wagon",
  x: "X comme Xylophone",
  y: "Y comme Yaourt",
  z: "Z comme Zèbre",
};

// Japanese sentence templates
const JAPANESE_SENTENCE_TEMPLATES: Record<string, string> = {
  // Fruits & Vegetables
  apple: "赤いリンゴを食べます",
  banana: "バナナは黄色くて甘いです",
  grapes: "紫のブドウが大好きです",
  strawberry: "イチゴは赤くてジューシーです",
  carrot: "ニンジンはサクサクしてオレンジ色です",
  watermelon: "スイカは大きくてジューシーです",
  orange: "オレンジは丸くてジューシーです",

  // Counting (1-10)
  one: "いち",
  two: "に",
  three: "さん",
  four: "よん",
  five: "ご",
  six: "ろく",
  seven: "なな",
  eight: "はち",
  nine: "きゅう",
  ten: "じゅう",

  // Shapes & Colors
  circle: "丸は丸いです",
  triangle: "三角形は三つの辺があります",
  star: "星は明るく輝きます",
  blue: "空は青いです",
  red: "リンゴは赤いです",
  green: "草は緑です",
  yellow: "太陽は黄色です",

  // Animals & Nature
  dog: "犬はワンワンと鳴きます",
  cat: "猫はニャーと鳴きます",
  turtle: "亀はゆっくり動きます",
  butterfly: "蝶々は美しいです",
  tree: "木は高いです",
  flower: "花はきれいです",
  elephant: "象は大きいです",
  penguin: "ペンギンは氷の上をよちよち歩きます",

  // Things That Go
  car: "車は道路を走ります",
  bus: "黄色いバスが学校に連れて行きます",
  airplane: "飛行機は空を飛びます",
  rocket: "ロケットは宇宙に行きます",
  bicycle: "公園に自転車で行きます",
  train: "電車は線路を走ります",

  // Weather
  sunny: "今日は晴れです",
  cloudy: "空は曇っています",
  rainy: "外は雨が降っています",
  rainbow: "美しい虹が見えます",
  moon: "月は夜に輝きます",
  sun: "太陽は光を与えてくれます",

  // Alphabet (Romanized)
  a: "エーはリンゴのエー",
  b: "ビーはボールのビー",
  c: "シーは猫のシー",
  d: "ディーは犬のディー",
  e: "イーは象のイー",
};

// Thai sentence templates
const THAI_SENTENCE_TEMPLATES: Record<string, string> = {
  // Fruits & Vegetables
  apple: "ฉันกินแอปเปิ้ลสีแดง",
  banana: "กล้วยสีเหลืองและหวาน",
  grapes: "ฉันชอบองุ่นสีม่วง",
  strawberry: "สตรอเบอร์รี่สีแดงและฉ่ำ",
  carrot: "แครอทกรอบและสีส้ม",
  watermelon: "แตงโมใหญ่และฉ่ำ",
  orange: "ส้มกลมและฉ่ำ",

  // Counting (1-10)
  one: "หนึ่ง",
  two: "สอง",
  three: "สาม",
  four: "สี่",
  five: "ห้า",
  six: "หก",
  seven: "เจ็ด",
  eight: "แปด",
  nine: "เก้า",
  ten: "สิบ",

  // Shapes & Colors
  circle: "วงกลมเป็นรูปกลม",
  triangle: "สามเหลี่ยมมีสามด้าน",
  star: "ดาวส่องแสงสว่าง",
  blue: "ท้องฟ้าสีน้ำเงิน",
  red: "แอปเปิ้ลสีแดง",
  green: "หญ้าสีเขียว",
  yellow: "ดวงอาทิตย์สีเหลือง",

  // Animals & Nature
  dog: "สุนัขเห่าโฮ่ง",
  cat: "แมวร้องเหมียว",
  turtle: "เต่าเคลื่อนที่ช้าๆ",
  butterfly: "ผีเสื้อสวยงาม",
  tree: "ต้นไม้สูง",
  flower: "ดอกไม้สวย",
  elephant: "ช้างตัวใหญ่",
  penguin: "เพนกวินเดินโซซัดโซเซบนน้ำแข็ง",

  // Things That Go
  car: "รถยนต์วิ่งบนถนน",
  bus: "รถบัสสีเหลืองพาเราไปโรงเรียน",
  airplane: "เครื่องบินบินบนท้องฟ้า",
  rocket: "จรวดไปสู่อวกาศ",
  bicycle: "ฉันปั่นจักรยานไปสวนสาธารณะ",
  train: "รถไฟวิ่งบนรางรถไฟ",

  // Weather
  sunny: "วันนี้อากาศแจ่มใส",
  cloudy: "ท้องฟ้ามีเมฆมาก",
  rainy: "ข้างนอกฝนตก",
  rainbow: "ฉันเห็นรุ้งที่สวยงาม",
  moon: "ดวงจันทร์ส่องแสงในยามค่ำคืน",
  sun: "ดวงอาทิตย์ให้แสงสว่างแก่เรา",

  // Alphabet
  a: "เอ คือ แอปเปิ้ล",
  b: "บี คือ ลูกบอล",
  c: "ซี คือ แมว",
  d: "ดี คือ สุนัข",
  e: "อี คือ ช้าง",
};

// Mandarin Chinese (Simplified) sentence templates
const MANDARIN_SENTENCE_TEMPLATES: Record<string, string> = {
  // Fruits & Vegetables
  apple: "我吃一个红苹果",
  banana: "香蕉是黄色的很甜",
  grapes: "我喜欢紫葡萄",
  strawberry: "草莓是红色的多汁",
  carrot: "胡萝卜脆脆的是橙色的",
  watermelon: "西瓜又大又多汁",
  orange: "橙子圆圆的很多汁",

  // Counting (1-10)
  one: "一",
  two: "二",
  three: "三",
  four: "四",
  five: "五",
  six: "六",
  seven: "七",
  eight: "八",
  nine: "九",
  ten: "十",

  // Shapes & Colors
  circle: "圆形是圆的",
  triangle: "三角形有三条边",
  star: "星星闪闪发光",
  blue: "天空是蓝色的",
  red: "苹果是红色的",
  green: "草是绿色的",
  yellow: "太阳是黄色的",

  // Animals & Nature
  dog: "狗汪汪叫",
  cat: "猫喵喵叫",
  turtle: "乌龟慢慢地移动",
  butterfly: "蝴蝶很美丽",
  tree: "树很高",
  flower: "花很漂亮",
  elephant: "大象很大",
  penguin: "企鹅在冰上摇摇摆摆地走",

  // Things That Go
  car: "汽车在路上开",
  bus: "黄色的巴士送我们去学校",
  airplane: "飞机在天空中飞",
  rocket: "火箭去太空",
  bicycle: "我骑自行车去公园",
  train: "火车在轨道上行驶",

  // Weather
  sunny: "今天是晴天",
  cloudy: "天空多云",
  rainy: "外面下雨了",
  rainbow: "我看见美丽的彩虹",
  moon: "月亮在晚上发光",
  sun: "太阳给我们光明",

  // Alphabet (Pinyin)
  a: "A 是 苹果",
  b: "B 是 球",
  c: "C 是 猫",
  d: "D 是 狗",
  e: "E 是 大象",
};

// Cantonese sentence templates
const CANTONESE_SENTENCE_TEMPLATES: Record<string, string> = {
  // Fruits & Vegetables
  apple: "我食紅色嘅蘋果",
  banana: "香蕉係黃色又甜",
  grapes: "我好鍾意紫色嘅提子",
  strawberry: "士多啤梨係紅色又多汁",
  carrot: "紅蘿蔔爽脆又係橙色",
  watermelon: "西瓜好大又多汁",
  orange: "橙係圓形又多汁",

  // Counting (1-10)
  one: "一",
  two: "二",
  three: "三",
  four: "四",
  five: "五",
  six: "六",
  seven: "七",
  eight: "八",
  nine: "九",
  ten: "十",

  // Shapes & Colors
  circle: "圓形係圓嘅",
  triangle: "三角形有三條邊",
  star: "星星閃閃發光",
  blue: "天空係藍色",
  red: "蘋果係紅色",
  green: "草係綠色",
  yellow: "太陽係黃色",

  // Animals & Nature
  dog: "狗仔汪汪叫",
  cat: "貓仔喵喵叫",
  turtle: "烏龜慢慢咁行",
  butterfly: "蝴蝶好靚",
  tree: "樹好高",
  flower: "花好靚",
  elephant: "大笨象好大隻",
  penguin: "企鵝喺冰上面搖吓搖吓咁行",

  // Things That Go
  car: "車喺馬路度行",
  bus: "黃色巴士帶我哋返學",
  airplane: "飛機喺天空飛",
  rocket: "火箭去太空",
  bicycle: "我踩單車去公園",
  train: "火車喺路軌度行",

  // Weather
  sunny: "今日好晴朗",
  cloudy: "天空好多雲",
  rainy: "出面落緊雨",
  rainbow: "我見到靚靚嘅彩虹",
  moon: "月光喺晚黑發光",
  sun: "太陽俾光我哋",

  // Alphabet (Romanized)
  a: "A 係 蘋果",
  b: "B 係 波",
  c: "C 係 貓",
  d: "D 係 狗",
  e: "E 係 大笨象",
};

// Language template mapping
const LANGUAGE_TEMPLATES: Record<SupportedLanguage, Record<string, string>> = {
  en: ENGLISH_SENTENCE_TEMPLATES,
  fr: FRENCH_SENTENCE_TEMPLATES,
  ja: JAPANESE_SENTENCE_TEMPLATES,
  th: THAI_SENTENCE_TEMPLATES,
  "zh-CN": MANDARIN_SENTENCE_TEMPLATES,
  "zh-HK": CANTONESE_SENTENCE_TEMPLATES,
};

/**
 * Get sentence template for a phrase in the specified language
 *
 * @param phrase - The item name (e.g., 'apple', 'banana')
 * @param language - Target language code (defaults to English)
 * @returns Localized sentence or undefined if phrase not found
 */
export function getSentenceTemplate(
  phrase: string,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): string | undefined {
  const normalizedPhrase = phrase.toLowerCase().trim();
  const templates = LANGUAGE_TEMPLATES[language] || ENGLISH_SENTENCE_TEMPLATES;

  // Try language-specific template first, fall back to English if not found
  return (
    templates[normalizedPhrase] || ENGLISH_SENTENCE_TEMPLATES[normalizedPhrase]
  );
}

/**
 * Check if a sentence template exists for a phrase
 */
export function hasSentenceTemplate(phrase: string): boolean {
  const normalizedPhrase = phrase.toLowerCase().trim();
  return normalizedPhrase in ENGLISH_SENTENCE_TEMPLATES;
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use getSentenceTemplate(phrase, language) instead
 */
export const SENTENCE_TEMPLATES = ENGLISH_SENTENCE_TEMPLATES;
