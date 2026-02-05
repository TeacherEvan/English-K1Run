/**
 * Header block for the home window card.
 * Separated to keep the main window component focused on layout.
 */
import { memo } from 'react'

export const HomeWindowHeader = memo(() => (
    <div className="text-center mb-8">
        <div className="text-6xl mb-4 animate-bounce">🏠</div>
        <h1 className="text-3xl font-bold text-primary mb-2">
            Welcome to Kindergarten Race
        </h1>
        <p className="text-muted-foreground">Choose your adventure!</p>
    </div>
))

HomeWindowHeader.displayName = 'HomeWindowHeader'
