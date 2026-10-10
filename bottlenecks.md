# Performance Bottlenecks & Recommendations

## 1. Head & SEO Omit
- **file:line**: `index.html:81-110`
- **Bottleneck**: Inline "Watchdog" script (approx. 30 lines) increases initial HTML weight and adds blocking parsing time.
- **Recommendation**: Move this logic to a separate external minified script or a small utility file loaded with `defer`. Reduces HTML size by ~1.5KB.

- **file:line**: `index.html:20-25`
- **Bottleneck**: Google Fonts loading via "print" media hack.
- **Recommendation**: Self-host "Plus Jakarta Sans" in WOFF2 format. Eliminates 2 DNS lookups and 2 TLS connections to `fonts.googleapis.com` and `fonts.gstatic.com`, typically saving 200-400ms in FCP/LCP.

## 2. Asset Sizes & Bundle Optimization
- **file:line**: `package.json:57, 69`
- **Bottleneck**: Heavy dependencies: `framer-motion` and `recharts`. `framer-motion` is imported in the main `Index.tsx` bundle.
- **Recommendation**: Verify if `framer-motion` can be lazy-loaded or used only for non-critical path components. `recharts` should definitely stay behind `lazy()` boundaries (which it appears to be in `AppPanels.tsx`).
- **Bottleneck**: Large PWA icons (`icon-512.png` at 103KB).
- **Recommendation**: Optimize images using WebP/AVIF or better compression. Target <50KB for large icons.

## 3. CSS & Rendering Performance
- **file:line**: `src/components/layout/VisualDecorations.tsx:11-16`
- **Bottleneck**: High blur values (`blur-[100px]`, `blur-[120px]`) are extremely GPU-expensive on mobile devices.
- **Recommendation**: Limit maximum blur to 40px on mobile (`blur-[40px] md:blur-[100px]`). This can improve scroll smoothness (INP) significantly on mid-range Android devices.

## 4. Core Web Vitals (CWV) Risks
- **file:line**: `src/pages/Index.tsx:81`
- **Bottleneck (CLS)**: `if (loading) return null;` during Auth check. This causes a complete layout shift from the `boot-splash` (in `index.html`) to a blank screen, then to the App/Login.
- **Recommendation**: Maintain a skeleton or the same background/layout during the auth-check phase to stabilize the viewport.

- **file:line**: `src/pages/Index.tsx:98-103`
- **Bottleneck (LCP)**: `motion.div` with entrance animation on the main content container.
- **Recommendation**: Remove entrance animations from elements that are likely to be the LCP (like the Header or Generator title) or use CSS-only animations (`@keyframes`) that start before JS hydration. `framer-motion` animations wait for the main thread to be free.

- **file:line**: `src/components/analytics/MetaPixelLoader.tsx:14`
- **Bottleneck (TBT)**: Async service call for Pixel ID before initialization.
- **Recommendation**: Hardcode the Pixel ID if it's static, or use a faster lookup mechanism to avoid delaying the third-party script injection.
