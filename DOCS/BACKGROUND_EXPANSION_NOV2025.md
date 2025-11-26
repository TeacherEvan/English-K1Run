# Background Expansion - November 2025

## Summary

Added 5 stunning new background images to enhance visual appeal for kindergarten students, doubling the variety from 5 to 10 rotating backgrounds.

## New Backgrounds Added

| Category | Filename | Description | File Size |
|----------|----------|-------------|-----------|
| 🌌 **Galaxy** | `nebula-galaxy.jpg` | Colorful cosmic nebula in deep space | 287 KB |
| 🌿 **Nature** | `tropical-waterfall.jpg` | Lush tropical jungle with cascading waterfall | 380 KB |
| 🏛️ **Architecture** | `colorful-buildings.jpg` | Vibrant pastel buildings from Burano, Italy | 375 KB |
| 🌸 **Nature** | `cherry-blossom.jpg` | Beautiful pink cherry blossom trees | 194 KB |
| 🎨 **Art** | `starry-art.jpg` | Colorful abstract art museum gallery | 557 KB |

## Technical Implementation

### Files Modified

1. **`scripts/download-backgrounds.js`**
   - Added 5 new image entries to `FALLBACK_IMAGES` array
   - Images sourced from Unsplash with free commercial license
   - Optimized to 1920x1080 at 80% quality

2. **`src/backgrounds-real.css`**
   - Added 5 new `.app-bg-*` CSS classes
   - Each class follows the established pattern:
     - `background-image: url('/backgrounds/{name}.jpg')`
     - `background-size: cover`
     - `background-position: center`
     - `background-attachment: fixed`
   - Dark overlay via `::before` pseudo-element for text readability

3. **`src/App.tsx`**
   - Updated `BACKGROUND_CLASSES` array from 5 to 10 entries
   - Added descriptive comments for new backgrounds

### CSS Class Details

```css
/* Overlay opacity varies by image brightness */
.app-bg-cherry-blossom::before { background: rgba(0, 0, 0, 0.05); }  /* Lighter for bright images */
.app-bg-colorful-buildings::before { background: rgba(0, 0, 0, 0.05); }
.app-bg-nebula-galaxy::before { background: rgba(0, 0, 0, 0.1); }     /* Standard overlay */
.app-bg-tropical-waterfall::before { background: rgba(0, 0, 0, 0.1); }
.app-bg-starry-art::before { background: rgba(0, 0, 0, 0.1); }
```

### Background Rotation System

- Backgrounds rotate randomly every 30 seconds during menu display
- Rotation pauses during active gameplay for performance
- `pickRandomBackground()` excludes current background to prevent repetition

## Image Sources

All images sourced from [Unsplash](https://unsplash.com) with free commercial license:

- Galaxy: `photo-1462331940025-496dfbfc7564`
- Waterfall: `photo-1546587348-d12660c30c50`
- Buildings: `photo-1534430480872-3498386e7856`
- Cherry Blossom: `photo-1522383225653-ed111181a951`
- Art Gallery: `photo-1579783902614-a3fb3927b6a5`

## Performance Considerations

- **Total new assets**: ~1.8 MB (5 images)
- **Average file size**: 359 KB (well-optimized)
- **Lazy loading**: Images load as CSS backgrounds when class is applied
- **No impact on initial load**: Backgrounds rotate after menu display

## Complete Background List

| # | Name | Category | Added |
|---|------|----------|-------|
| 1 | `mountain-sunrise` | Nature | Original |
| 2 | `ocean-sunset` | Nature | Original |
| 3 | `forest-path` | Nature | Original |
| 4 | `lavender-field` | Nature | Original |
| 5 | `aurora-night` | Nature/Sky | Original |
| 6 | `nebula-galaxy` | Galaxy/Space | Nov 2025 |
| 7 | `tropical-waterfall` | Nature | Nov 2025 |
| 8 | `colorful-buildings` | Architecture | Nov 2025 |
| 9 | `cherry-blossom` | Nature/Spring | Nov 2025 |
| 10 | `starry-art` | Art | Nov 2025 |

## Re-downloading Backgrounds

If backgrounds need to be regenerated:

```bash
node scripts/download-backgrounds.js
```

This will:

1. Skip existing images
2. Download any missing images
3. Generate updated CSS (note: CSS generation is hardcoded for original 5)

## Future Enhancements

- Add seasonal background packs (Winter, Summer, etc.)
- Allow teachers to upload custom backgrounds
- Add subtle parallax animation option
- Consider WebP format for smaller file sizes
