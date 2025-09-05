import { useState, useEffect } from 'react'

interface DisplaySettings {
  scale: number
  fontSize: number
  objectSize: number
  turtleSize: number
  spacing: number
  fallSpeed: number
  isLandscape: boolean
  screenWidth: number
  screenHeight: number
  aspectRatio: number
}

export function useDisplayAdjustment() {
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    scale: 1,
    fontSize: 1,
    objectSize: 1,
    turtleSize: 1,
    spacing: 1,
    fallSpeed: 1,
    isLandscape: false,
    screenWidth: 0,
    screenHeight: 0,
    aspectRatio: 1
  })

  useEffect(() => {
    const updateDisplaySettings = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const aspectRatio = width / height
      const isLandscape = width > height

      // Base dimensions for scaling calculations (designed for 1920x1080)
      const baseWidth = 1920
      const baseHeight = 1080
      
      // Calculate scale based on smaller dimension to ensure content fits
      const widthScale = width / baseWidth
      const heightScale = height / baseHeight
      const scale = Math.min(widthScale, heightScale)

      // Optimize calculations by using cached values
      let fontSize = scale
      let objectSize = scale
      let turtleSize = scale
      let spacing = scale
      let fallSpeed = 1

      // Simplified breakpoint calculations for better performance
      if (width < 768) {
        fontSize = Math.max(scale * 1.2, 0.8)
        objectSize = Math.max(scale * 1.3, 0.9)
        turtleSize = Math.max(scale * 1.1, 0.8)
        spacing = Math.max(scale * 1.2, 0.9)
        fallSpeed = 0.7 // Slower for better performance on mobile
      } else if (width < 1200) {
        fontSize = Math.max(scale * 1.1, 0.9)
        objectSize = Math.max(scale * 1.1, 0.95)
        turtleSize = Math.max(scale * 1.05, 0.9)
        spacing = Math.max(scale * 1.1, 0.95)
        fallSpeed = 0.85
      } else if (width < 1920) {
        fontSize = Math.max(scale, 0.95)
        objectSize = Math.max(scale, 1)
        turtleSize = Math.max(scale, 0.95)
        spacing = Math.max(scale, 1)
        fallSpeed = 1
      } else {
        fontSize = Math.min(scale * 1.1, 1.3)
        objectSize = Math.min(scale * 1.05, 1.2)
        turtleSize = Math.min(scale * 1.1, 1.25)
        spacing = Math.min(scale * 1.05, 1.15)
        fallSpeed = 1.1
      }

      // Special adjustments for extreme aspect ratios
      if (aspectRatio > 2.5) {
        spacing *= 1.2
        objectSize *= 0.9
      } else if (aspectRatio < 0.6) {
        fontSize *= 1.1
        objectSize *= 1.1
        spacing *= 0.9
      }

      // Portrait mode adjustments
      if (!isLandscape && width < 768) {
        objectSize *= 1.2
        turtleSize *= 1.1
        fallSpeed *= 0.8 // Further reduced for mobile portrait
      }

      setDisplaySettings(prev => {
        // Only update if values actually changed to prevent unnecessary renders
        if (
          prev.scale === scale &&
          prev.fontSize === fontSize &&
          prev.objectSize === objectSize &&
          prev.turtleSize === turtleSize &&
          prev.spacing === spacing &&
          prev.fallSpeed === fallSpeed &&
          prev.screenWidth === width &&
          prev.screenHeight === height
        ) {
          return prev
        }

        return {
          scale,
          fontSize,
          objectSize,
          turtleSize,
          spacing,
          fallSpeed,
          isLandscape,
          screenWidth: width,
          screenHeight: height,
          aspectRatio
        }
      })
    }

    // Initial calculation
    updateDisplaySettings()

    // Debounced resize handler to prevent excessive recalculations
    let resizeTimeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(updateDisplaySettings, 100)
    }

    // Listen for orientation changes with debounce
    let orientationTimeout: NodeJS.Timeout
    const handleOrientationChange = () => {
      clearTimeout(orientationTimeout)
      orientationTimeout = setTimeout(updateDisplaySettings, 200)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)
    document.addEventListener('fullscreenchange', updateDisplaySettings)

    return () => {
      clearTimeout(resizeTimeout)
      clearTimeout(orientationTimeout)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
      document.removeEventListener('fullscreenchange', updateDisplaySettings)
    }
  }, [])

  // Helper function to get CSS custom properties for scaling
  const getScaledStyles = () => ({
    '--game-scale': displaySettings.scale.toString(),
    '--font-scale': displaySettings.fontSize.toString(),
    '--object-scale': displaySettings.objectSize.toString(),
    '--turtle-scale': displaySettings.turtleSize.toString(),
    '--spacing-scale': displaySettings.spacing.toString(),
    '--fall-speed-scale': displaySettings.fallSpeed.toString()
  } as React.CSSProperties)

  return {
    displaySettings,
    getScaledStyles,
    isSmallScreen: displaySettings.screenWidth < 768,
    isMediumScreen: displaySettings.screenWidth >= 768 && displaySettings.screenWidth < 1200,
    isLargeScreen: displaySettings.screenWidth >= 1200,
    isUltrawide: displaySettings.aspectRatio > 2.5,
    isTallScreen: displaySettings.aspectRatio < 0.6
  }
}