import Link from "next/link";

export default function RootPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Praxisforum 2026 Recap</p>
          <h1>KI in Planung, Bau und Gebäudebetrieb</h1>
          <p>
            <a className="btn" href="/de/">Deutsch</a>{" "}
            <a className="btn ghost" href="/en/">English</a>
          </p>
          <p>
            <Link href="/de/">Weiter zur deutschen Fassung →</Link>
          </p>
        </div>
      </section>
      <script
        dangerouslySetInnerHTML={{
          __html: 'location.replace("/de/");',
        }}
      />
      <noscript>
        <meta httpEquiv="refresh" content="0; url=/de/" />
      </noscript>
    </main>
  );
}
