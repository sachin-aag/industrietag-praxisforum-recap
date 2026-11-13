import { isLocale, type Locale } from "@/i18n/config";
import { t } from "@/i18n/ui";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  const lang: Locale = isLocale(raw) ? raw : "de";
  return (
    <>
      <a className="skip" href="#main">
        {t(lang).skipToContent}
      </a>
      <Header lang={lang} />
      <main id="main">{children}</main>
      <Footer lang={lang} />
    </>
  );
}
