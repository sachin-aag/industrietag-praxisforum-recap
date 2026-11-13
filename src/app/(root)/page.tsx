export default function RootPage() {
  return (
    <main style={{ padding: "64px 24px", maxWidth: 560, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, lineHeight: 1.2 }}>Praxisforum 2026 – Rückblick</h1>
      <p>
        <a href="/de/">Deutsch</a> · <a href="/en/">English</a>
      </p>
      <script dangerouslySetInnerHTML={{ __html: 'location.replace("/de/");' }} />
      <noscript>
        <meta httpEquiv="refresh" content="0; url=/de/" />
      </noscript>
    </main>
  );
}
