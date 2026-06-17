import HearFromUs from "./components/HearFromUs";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-24 bg-bone text-ink">
      <p className="font-[family-name:var(--font-inter)] text-xs sm:text-sm uppercase tracking-[0.3em] text-ink/60 mb-6">
        Coming Soon
      </p>
      <h1
        className="font-[family-name:var(--font-fraunces)] text-center text-ink leading-[0.95] tracking-[-0.02em] text-[clamp(3rem,12vw,9rem)] font-light"
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 0' }}
      >
        The Heights,
        <br />
        Rooted.
      </h1>

      <div className="mt-16">
        <HearFromUs />
      </div>
    </main>
  );
}
