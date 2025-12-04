import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert"
import { Button } from "./components/ui/button"
import { Card } from "./components/ui/card"

import { AlertTriangleIcon, RefreshCwIcon, HomeIcon } from "lucide-react"

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

/**
 * ErrorFallback - Beautiful error fallback component for react-error-boundary
 * 
 * Displays a user-friendly error message with options to retry or reload.
 * In development mode, rethrows errors for better debugging.
 * 
 * @component
 */
export const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => {
  // When encountering an error in the development mode, rethrow it and don't display the boundary.
  // The parent UI will take care of showing a more helpful dialog.
  if (import.meta.env.DEV) throw error

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-destructive/10 via-background to-destructive/5 p-4">
      <Card className="max-w-2xl w-full p-8 shadow-2xl border-destructive/20 animate-in fade-in zoom-in duration-500">
        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="text-7xl animate-bounce">😔</div>
            <div className="absolute -top-2 -right-2 text-2xl animate-pulse">
              <AlertTriangleIcon className="w-8 h-8 text-destructive" />
            </div>
          </div>
        </div>

        {/* Main Error Alert */}
        <Alert variant="destructive" className="mb-6 shadow-lg border-2">
          <AlertTriangleIcon />
          <AlertTitle className="text-xl font-bold">
            Oops! The game encountered an error
          </AlertTitle>
          <AlertDescription className="text-base mt-2">
            Don't worry - this happens sometimes! We've logged the error. 
            Please try again or reload the page to continue playing.
          </AlertDescription>
        </Alert>
        
        {/* Error Details */}
        <div className="bg-muted/30 border rounded-xl p-5 mb-6 transition-all hover:shadow-md">
          <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <span>📋</span>
            <span>Error Details:</span>
          </h3>
          <pre className="text-xs text-destructive bg-background/80 p-4 rounded-lg border border-destructive/20 overflow-auto max-h-40 font-mono">
            {error.message}
          </pre>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={resetErrorBoundary} 
            size="lg"
            className="flex-1 group"
          >
            <RefreshCwIcon className="transition-transform group-hover:rotate-180 duration-500" />
            Try Again
          </Button>
          
          <Button 
            onClick={handleReload}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            <HomeIcon />
            Reload Game
          </Button>
        </div>

        {/* Timestamp for support */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Error occurred at: <span className="font-mono font-semibold">{new Date().toLocaleString()}</span>
        </p>
      </Card>
    </div>
  )
}
