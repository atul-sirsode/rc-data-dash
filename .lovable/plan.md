

## Plan: Global Performance Optimizations

Apply all major React and Core Web Vitals optimizations in a centralized manner so every page benefits automatically.

### 1. Route-Level Code Splitting (App.tsx)
Replace all static page imports with `React.lazy()` + a shared `Suspense` fallback. This is the single biggest win — every route loads on demand.

```tsx
const Home = React.lazy(() => import('./pages/Home'));
const FastTag = React.lazy(() => import('./pages/FastTag'));
// ... all pages

<Suspense fallback={<PageLoader />}>
  <AppRoutes />
</Suspense>
```

### 2. Font Loading Optimization (index.html + index.css)
- Move Google Fonts from CSS `@import` to HTML `<link rel="preconnect">` + `<link rel="stylesheet">` in `index.html` head.
- This eliminates the render-blocking CSS import and improves LCP.

### 3. Memoize Layout Components
- Wrap `AppSidebar` and `AppFooter` with `React.memo` since they rarely change props.
- This prevents re-renders when page content updates.

### 4. Optimized QueryClient Defaults (App.tsx)
Configure `QueryClient` with sensible defaults to reduce unnecessary network calls:
```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 1 },
  },
});
```

### 5. Create a Shared PageLoader Component
A lightweight spinner/skeleton used as the `Suspense` fallback, keeping CLS minimal during lazy loads.

### Files to change:
| File | Change |
|---|---|
| `src/App.tsx` | Lazy imports, Suspense wrapper, QueryClient defaults |
| `index.html` | Preconnect + stylesheet link for Google Fonts |
| `src/index.css` | Remove `@import url(...)` line |
| `src/components/PageLoader.tsx` | New — simple centered spinner |
| `src/components/AppSidebar.tsx` | Wrap export with `React.memo` |
| `src/components/AppFooter.tsx` | Wrap export with `React.memo` |

