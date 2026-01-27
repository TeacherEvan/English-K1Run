/**
 * Audio Priorities Module
 *
 * Defines audio files by priority for progressive loading.
 * Split from audio-loader.ts for better organization.
 *
 * @module audio/audio-priorities
 */

import { AudioPriority } from "./types";

/** Audio files by priority for progressive loading */
export const AUDIO_PRIORITIES: Record<AudioPriority, string[]> = {
  [AudioPriority.CRITICAL]: [
    "welcome",
    "welcome_association",
    "welcome_learning",
    "welcome_association_thai",
    "welcome_learning_thai",
    "success",
    "tap",
    "wrong",
    "win",
  ],
  [AudioPriority.COMMON]: [
    // Numbers 1-10
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    // Common letters
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    // Basic fruits and vegetables
    "apple",
    "banana",
    "orange",
    "grape",
    "strawberry",
    "carrot",
    "broccoli",
    "tomato",
    "potato",
    "onion",
  ],
  [AudioPriority.RARE]: [
    // Weather
    "sunny",
    "cloudy",
    "rainy",
    "snowy",
    "windy",
    // Vehicles
    "car",
    "bus",
    "truck",
    "bicycle",
    "airplane",
    "boat",
    // Animals
    "dog",
    "cat",
    "bird",
    "fish",
    "cow",
    "pig",
    "sheep",
    // Colors
    "red",
    "blue",
    "green",
    "yellow",
    "orange",
    "purple",
    "pink",
    "brown",
    "black",
    "white",
    // Shapes
    "circle",
    "square",
    "triangle",
    "rectangle",
    "diamond",
    "star",
  ],
};
