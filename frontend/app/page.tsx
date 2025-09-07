// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      {/* Hero */}
      <section className="card overflow-hidden relative">
        <div className="absolute -inset-1 opacity-20"
             style={{ background:
               "radial-gradient(1200px 400px at 10% -10%, rgba(79,70,229,.25), transparent 60%), radial-gradient(800px 300px at 110% 10%, rgba(79,70,229,.18), transparent 60%)" }}
        />
        <div className="relative">
          <h1 className="title text-3xl md:text-4xl">Dialed-in Menswear, Powered by AI</h1>
          <p className="mt-2 text-[0.98rem] opacity-90 max-w-2xl">
            Get outfit suggestions tailored to your <b>occasion</b>, <b>weather</b>, and <b>style vibe</b>. 
            We factor in your <b>age</b>, <b>body type</b>, and any <b>must-include pieces</b>. 
            Save favorites and refine with feedback.
          </p>
          <div className="mt-4 flex gap-2 flex-wrap">
            <Link href="/generate" className="btn-primary">Generate an Outfit</Link>
            <Link href="/wardrobe" className="btn">View your Wardrobe</Link>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="grid gap-3 md:grid-cols-3 mt-4">
        <Card
          title="Smart Suggestions"
          desc="Men’s outfits that respect your vibe (smart casual, minimalist, old money, streetwear, and more)."
          bullets={["Occasion-aware", "Weather-aware", "Body-type notes"]}
        />
        <Card
          title="Icon Previews"
          desc="Each look can include minimal icons for top, bottom, shoes, outerwear, and accessories."
          bullets={["Clean visuals", "Palette swatches", "Fast to scan"]}
        />
        <Card
          title="Save & Refine"
          desc="Keep favorites, submit feedback, and get tighter fits on the next round."
          bullets={["Local cache", "Quick recall", "Feedback loop"]}
        />
      </section>

      {/* How it works */}
      <section className="card mt-4">
        <h2 className="subtitle">How it works</h2>
        <ol className="grid gap-3 md:grid-cols-3 text-sm">
          <li className="p-3 rounded-lg border border-[var(--border)] bg-[var(--hover)]">
            <Step n={1} title="Tell us the context">
              Occasion, temp & rain, style vibe & fit, plus optional centerpiece and must-include.
            </Step>
          </li>
          <li className="p-3 rounded-lg border border-[var(--border)] bg-[var(--hover)]">
            <Step n={2} title="We generate options">
              The backend asks the model for clean JSON outfits, with notes and palette.
            </Step>
          </li>
          <li className="p-3 rounded-lg border border-[var(--border)] bg-[var(--hover)]">
            <Step n={3} title="Save & iterate">
              Save favorites, view later, and refine with feedback to lock in your style.
            </Step>
          </li>
        </ol>
        <div className="mt-4">
          <Link href="/generate" className="btn-primary">Start now</Link>
        </div>
      </section>

      {/* Quick links */}
      <section className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="card">
          <h3 className="font-semibold mb-2">Popular vibes</h3>
          <div className="chip-row">
            {["smart casual","minimalist","old money","streetwear","professional","relaxed"]
              .map(v => <span key={v} className="chip">{v}</span>)}
          </div>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-2">Common occasions</h3>
          <div className="chip-row">
            {["coffee date","office","wedding guest","night out","dinner","interview"]
              .map(o => <span key={o} className="chip">{o}</span>)}
          </div>
        </div>
      </section>
    </main>
  );
}

function Card({
  title, desc, bullets,
}: { title: string; desc: string; bullets: string[] }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-1 text-sm opacity-90">{desc}</p>
      <ul className="mt-2 space-y-1 text-sm opacity-90 list-disc pl-5">
        {bullets.map(b => <li key={b}>{b}</li>)}
      </ul>
    </div>
  );
}

function Step({
  n, title, children,
}: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-fg)] text-xs font-bold">
          {n}
        </span>
        <span className="font-semibold">{title}</span>
      </div>
      <p className="mt-2 opacity-90">{children}</p>
    </div>
  );
}