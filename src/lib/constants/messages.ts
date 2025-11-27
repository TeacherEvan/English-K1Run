/**
 * Achievement and feedback messages for game events
 */

export interface FeedbackMessage {
    message: string
    emoji: string
}

// Positive messages for correct taps
export const CORRECT_MESSAGES: FeedbackMessage[] = [
    { message: 'Perfect!', emoji: '⭐' },
    { message: 'Great Job!', emoji: '✨' },
    { message: 'Awesome!', emoji: '🌟' },
    { message: 'Excellent!', emoji: '💫' },
    { message: 'Super!', emoji: '🎉' },
    { message: 'Amazing!', emoji: '🎊' },
    { message: 'Fantastic!', emoji: '🌈' },
    { message: 'Wonderful!', emoji: '💖' },
    { message: 'Brilliant!', emoji: '✨' },
    { message: 'You did it!', emoji: '🏆' }
]

// Fun messages for worm taps (currently unused but kept for future use)
export const WORM_MESSAGES: FeedbackMessage[] = [
    { message: 'Got one!', emoji: '🐛' },
    { message: 'Nice catch!', emoji: '👍' },
    { message: 'Squish!', emoji: '💥' },
    { message: 'Gotcha!', emoji: '🎯' },
    { message: 'Wiggle wiggle!', emoji: '🐛' },
    { message: 'Worm away!', emoji: '✨' },
    { message: 'Bye bye worm!', emoji: '👋' },
    { message: 'Caught it!', emoji: '🎉' }
]
