/**
 * Game category definitions for all educational levels
 * Each category contains items (emoji + name pairs) for the game
 */

import type { GameCategory } from '../../types/game'

export const GAME_CATEGORIES: GameCategory[] = [
    {
        name: "Fruits & Vegetables",
        items: [
            { emoji: "🍎", name: "apple" },
            { emoji: "🍌", name: "banana" },
            { emoji: "🍇", name: "grapes" },
            { emoji: "🍓", name: "strawberry" },
            { emoji: "🥕", name: "carrot" },
            { emoji: "🥒", name: "cucumber" },
            { emoji: "🍉", name: "watermelon" },
            { emoji: "🥦", name: "broccoli" },
            { emoji: "🍊", name: "orange" },
            { emoji: "🍋", name: "lemon" },
            { emoji: "🍑", name: "peach" },
            { emoji: "🍒", name: "cherry" },
            { emoji: "🥝", name: "kiwi" }
        ]
    },
    {
        name: "Counting Fun",
        items: [
            { emoji: "1️⃣", name: "one" },
            { emoji: "⚀", name: "one" },
            { emoji: "2️⃣", name: "two" },
            { emoji: "⚁", name: "two" },
            { emoji: "3️⃣", name: "three" },
            { emoji: "⚂", name: "three" },
            { emoji: "4️⃣", name: "four" },
            { emoji: "⚃", name: "four" },
            { emoji: "5️⃣", name: "five" },
            { emoji: "⚄", name: "five" },
            { emoji: "6️⃣", name: "six" },
            { emoji: "⚅", name: "six" },
            { emoji: "7️⃣", name: "seven" },
            { emoji: "8️⃣", name: "eight" },
            { emoji: "9️⃣", name: "nine" },
            { emoji: "🔟", name: "ten" }
        ]
    },
    {
        name: "Shapes & Colors",
        items: [
            { emoji: "🔵", name: "blue" },
            { emoji: "🟥", name: "red" },
            { emoji: "🔶", name: "orange" },
            { emoji: "🟩", name: "green" },
            { emoji: "🔺", name: "triangle" },
            { emoji: "⭐", name: "star" },
            { emoji: "🟣", name: "purple" },
            { emoji: "⚪", name: "white" },
            { emoji: "🟡", name: "yellow" },
            { emoji: "🟤", name: "brown" },
            { emoji: "⬛", name: "black" },
            { emoji: "🔷", name: "diamond" },
            { emoji: "🟠", name: "circle" }
        ]
    },
    {
        name: "Animals & Nature",
        items: [
            { emoji: "🐶", name: "dog" },
            { emoji: "🐱", name: "cat" },
            { emoji: "🦊", name: "fox" },
            { emoji: "🐢", name: "turtle" },
            { emoji: "🦋", name: "butterfly" },
            { emoji: "🦉", name: "owl" },
            { emoji: "🌳", name: "tree" },
            { emoji: "🌸", name: "flower" },
            { emoji: "🐘", name: "elephant" },
            { emoji: "🦁", name: "lion" },
            { emoji: "🐰", name: "rabbit" },
            { emoji: "🦒", name: "giraffe" },
            { emoji: "🐧", name: "penguin" }
        ]
    },
    {
        name: "Things That Go",
        items: [
            { emoji: "🚗", name: "car" },
            { emoji: "🚌", name: "bus" },
            { emoji: "🚒", name: "fire truck" },
            { emoji: "✈️", name: "airplane" },
            { emoji: "🚀", name: "rocket" },
            { emoji: "🚲", name: "bicycle" },
            { emoji: "🚁", name: "helicopter" },
            { emoji: "🚤", name: "boat" },
            { emoji: "🚂", name: "train" },
            { emoji: "🚕", name: "taxi" },
            { emoji: "🚙", name: "van" },
            { emoji: "🛴", name: "scooter" },
            { emoji: "🛵", name: "motorcycle" }
        ]
    },
    {
        name: "Weather Wonders",
        items: [
            { emoji: "☀️", name: "sunny" },
            { emoji: "☁️", name: "cloudy" },
            { emoji: "🌧️", name: "rainy" },
            { emoji: "⛈️", name: "stormy" },
            { emoji: "❄️", name: "snowy" },
            { emoji: "🌈", name: "rainbow" },
            { emoji: "🌪️", name: "tornado" },
            { emoji: "🌬️", name: "windy" },
            { emoji: "🌙", name: "moon" },
            { emoji: "⭐", name: "star" },
            { emoji: "🌞", name: "sun" },
            { emoji: "🌫️", name: "foggy" },
            { emoji: "⚡", name: "lightning" }
        ]
    },
    {
        name: "Feelings & Actions",
        items: [
            { emoji: "😄", name: "happy" },
            { emoji: "😢", name: "sad" },
            { emoji: "😠", name: "angry" },
            { emoji: "😴", name: "sleepy" },
            { emoji: "🤗", name: "hug" },
            { emoji: "👏", name: "clap" },
            { emoji: "🕺", name: "dance" },
            { emoji: "🤸", name: "flip" },
            { emoji: "😊", name: "smile" },
            { emoji: "😂", name: "laugh" },
            { emoji: "🤔", name: "think" },
            { emoji: "🎉", name: "celebrate" },
            { emoji: "👋", name: "wave" }
        ]
    },
    {
        name: "Body Parts",
        items: [
            { emoji: "👁️", name: "eye" },
            { emoji: "👂", name: "ear" },
            { emoji: "👃", name: "nose" },
            { emoji: "👄", name: "mouth" },
            { emoji: "👅", name: "tongue" },
            { emoji: "🖐️", name: "hand" },
            { emoji: "🦶", name: "foot" },
            { emoji: "🦵", name: "leg" },
            { emoji: "🦷", name: "tooth" },
            { emoji: "💪", name: "arm" },
            { emoji: "🧠", name: "brain" },
            { emoji: "❤️", name: "heart" }
        ]
    },
    {
        name: "Alphabet Challenge",
        items: [
            { emoji: "A", name: "A" },
            { emoji: "B", name: "B" },
            { emoji: "C", name: "C" },
            { emoji: "D", name: "D" },
            { emoji: "E", name: "E" },
            { emoji: "F", name: "F" },
            { emoji: "G", name: "G" },
            { emoji: "H", name: "H" },
            { emoji: "I", name: "I" },
            { emoji: "J", name: "J" },
            { emoji: "K", name: "K" },
            { emoji: "L", name: "L" },
            { emoji: "M", name: "M" },
            { emoji: "N", name: "N" },
            { emoji: "O", name: "O" },
            { emoji: "P", name: "P" },
            { emoji: "Q", name: "Q" },
            { emoji: "R", name: "R" },
            { emoji: "S", name: "S" },
            { emoji: "T", name: "T" },
            { emoji: "U", name: "U" },
            { emoji: "V", name: "V" },
            { emoji: "W", name: "W" },
            { emoji: "X", name: "X" },
            { emoji: "Y", name: "Y" },
            { emoji: "Z", name: "Z" }
        ]
    }
]

// Freeze to prevent accidental runtime mutation (sequence progress, etc. must
// live in per-session React state/refs, never on this shared constant).
GAME_CATEGORIES.forEach((category) => Object.freeze(category))
Object.freeze(GAME_CATEGORIES)
