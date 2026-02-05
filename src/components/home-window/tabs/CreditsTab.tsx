/**
 * Credits tab content for the home window.
 * Static attribution and version details.
 */
import { memo } from 'react'

export const CreditsTab = memo(() => (
    <div className="space-y-6 text-center">
        <div>
            <h2 className="text-xl font-semibold mb-4">Credits</h2>
            <div className="space-y-4 text-muted-foreground">
                <div>
                    <h3 className="font-semibold text-foreground">Game Development</h3>
                    <p>Built with React, TypeScript, and Tailwind CSS</p>
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Audio</h3>
                    <p>Generated with ElevenLabs AI</p>
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Special Thanks</h3>
                    <p>Sangsom Kindergarten for inspiration</p>
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Version</h3>
                    <p>Kindergarten Race v2.0 - Dec 2025</p>
                </div>
            </div>
        </div>
    </div>
))

CreditsTab.displayName = 'CreditsTab'
