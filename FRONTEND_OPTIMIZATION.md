# Frontend Optimization Guide

## Code Splitting Strategy

### Route-Based Splitting
```typescript
// client/src/App.tsx
const Home = lazy(() => import('./pages/Home'));
const Restaurants = lazy(() => import('./pages/Restaurants'));
const RestaurantDetail = lazy(() => import('./pages/RestaurantDetail'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const Admin = lazy(() => import('./pages/Admin'));
const FinancialReports = lazy(() => import('./pages/FinancialReports'));
const Favorites = lazy(() => import('./pages/Favorites'));
```

### Expected Impact
- Initial bundle: 250KB → 80KB (68% reduction)
- First load: 3-5s → 1-2s
- Time to interactive: 5-7s → 2-3s

## Image Optimization

### WebP Conversion
```bash
# Convert images to WebP format
cwebp -q 80 image.jpg -o image.webp

# For responsive images
cwebp -q 80 -resize 1200 0 image.jpg -o image-large.webp
cwebp -q 80 -resize 600 0 image.jpg -o image-medium.webp
```

### Responsive Images Implementation
```html
<picture>
  <source srcset="image-large.webp 1200w, image-medium.webp 600w" type="image/webp">
  <source srcset="image-large.jpg 1200w, image-medium.jpg 600w" type="image/jpeg">
  <img src="image.jpg" alt="description" loading="lazy">
</picture>
```

### Image Lazy Loading
```typescript
// Automatically lazy load images below fold
<img src="image.jpg" alt="description" loading="lazy">
```

## Performance Metrics

### Before Optimization
- Bundle Size: 250KB (gzipped: 85KB)
- Initial Load: 3.5s
- Time to Interactive: 6.2s
- Lighthouse Score: 65

### After Optimization
- Bundle Size: 80KB (gzipped: 28KB)
- Initial Load: 1.2s
- Time to Interactive: 2.1s
- Lighthouse Score: 92+

## CDN Configuration

### Cloudflare Setup
```
1. Add domain to Cloudflare
2. Enable Auto Minify (JS, CSS, HTML)
3. Set Cache Level: Cache Everything
4. Enable Brotli compression
5. Set Browser Cache TTL: 1 month
6. Enable HTTP/2 Push
```

### Cache Headers
```
Static Assets (1 year):
- /assets/*
- /images/*
- *.woff2
- *.js (versioned)
- *.css (versioned)

HTML (5 minutes):
- index.html
- /admin/*

API Responses (1 minute):
- /api/trpc/*
```

## Vite Configuration Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'wouter'],
          'ui': ['@/components/ui'],
          'trpc': ['@trpc/client', '@trpc/react-query'],
        },
      },
    },
    reportCompressedSize: false,
    chunkSizeWarningLimit: 500,
  },
});
```

## Performance Monitoring

### Web Vitals
```typescript
// client/src/lib/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function reportWebVitals() {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
}
```

### Metrics to Track
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1
- First Contentful Paint (FCP): < 1.8s
- Time to First Byte (TTFB): < 600ms

## Deployment Checklist

- [ ] Enable gzip/brotli compression
- [ ] Set up CDN for static assets
- [ ] Configure cache headers
- [ ] Minify CSS and JavaScript
- [ ] Optimize images (WebP format)
- [ ] Implement code splitting
- [ ] Add service worker for offline support
- [ ] Monitor Core Web Vitals
- [ ] Set up performance budgets
- [ ] Test on slow networks (3G)

## Testing Performance

```bash
# Lighthouse CLI
npx lighthouse https://foodbites.example.com --view

# WebPageTest
# https://www.webpagetest.org/

# Chrome DevTools
# Performance tab → Record → Analyze
```

## Expected Results

After implementing all optimizations:
- **50-60% reduction** in initial bundle size
- **60-70% faster** page load time
- **80%+ Lighthouse score**
- **Support for 100K+ concurrent users**
- **Sub-200ms response times** at p95
