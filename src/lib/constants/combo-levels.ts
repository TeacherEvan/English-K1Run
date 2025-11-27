/**
 * Combo celebration thresholds and messages
 */

export interface ComboLevel {
    streak: number
    title: string
    description: string
}

export const COMBO_LEVELS: ComboLevel[] = [
    {
        streak: 3,
        title: 'Triple Treat!',
        description: 'Three perfect taps in a row! Keep the magic going!'
    },
    {
        streak: 5,
        title: 'Fantastic Five!',
        description: 'Five flawless finds! You are racing ahead!'
    },
    {
        streak: 7,
        title: 'Lucky Legend!',
        description: 'Seven sparkling successes! Unstoppable energy!'
    }
]
