# Add Vercel Web Analytics

## Summary
Free, privacy-friendly traffic + Web Vitals tracking. One toggle in the Vercel dashboard + a one-line `<Analytics />` component in the root layout. Worth turning on before DNS cutover so we have inquiry-conversion data from day one of public traffic.

## Action Items

- [ ] In Vercel dashboard: Project → Analytics → Enable Web Analytics
- [ ] `npm install @vercel/analytics`
- [ ] In `app/layout.tsx`, import and render the analytics component:
  ```tsx
  import { Analytics } from "@vercel/analytics/next";
  // ...
  <body>
    {children}
    <Analytics />
  </body>
  ```
- [ ] Deploy and confirm a page view shows up in the Vercel Analytics dashboard within ~30 seconds

## Optional: Speed Insights

Same package family, separate dashboard:
- [ ] `npm install @vercel/speed-insights`
- [ ] Render `<SpeedInsights />` alongside `<Analytics />`

## Technical Details

- Free tier: 2,500 events/month — plenty for a luxury lander
- No cookies, no tracking consent UI required
- The `<Analytics />` script is loaded async; zero impact on LCP
- Works on Vercel only — local `npm run dev` runs the component but reports no data
