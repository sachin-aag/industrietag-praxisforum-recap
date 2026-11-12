import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { t } from "@/i18n/ui";
import { HtmlLang } from "@/components/HtmlLang";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const copy = t(lang);
  return {
    title: {
      default: copy.metaTitleDefault,
      template: copy.metaTitleTemplate,
    },
    description: copy.metaDescription,
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <>
      <HtmlLang lang={lang as Locale} />
      {children}
    </>
  );
}
