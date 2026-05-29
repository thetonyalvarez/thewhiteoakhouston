# Rate Limiting on /api/subscribe

## Summary
Without a rate limit, a single bot can fire thousands of POSTs to `/api/subscribe` and either flood Propertybase or rack up Vercel function invocations. Vercel has a built-in rate-limiting product on Pro plans, or we can implement a simple IP-based one with Upstash for free.

## Action Items

- [ ] Decide: Vercel Firewall rate-limit rule (simplest, Pro plan) vs. Upstash Redis-based limiter (free tier, more code)
- [ ] **Vercel Firewall path:**
  - [ ] In Vercel dashboard, Project → Firewall → add a rate-limit rule on `/api/subscribe`: e.g. 5 requests per IP per minute
  - [ ] No code changes needed
- [ ] **Upstash path:**
  - [ ] `npm i @upstash/redis @upstash/ratelimit`
  - [ ] Create `lib/rate-limit.ts` using a sliding-window limiter
  - [ ] Wrap the POST handler: check the limiter; if exceeded, return 429
  - [ ] Add env vars `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- [ ] Test manually: hammer the endpoint with `for i in {1..20}; do curl ...`; confirm 429s after the threshold

## Technical Details

- A luxury lander gets maybe 5–50 legitimate submissions per day total. A threshold of 5/min per IP is generous for humans and aggressive against bots.
- Tony is on Vercel Pro for other Nan projects; check if The White Oak project inherits or needs its own subscription.
