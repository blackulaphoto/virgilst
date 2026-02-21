import { useEffect } from "react";

export type SeoConfig = {
  title: string;
  description: string;
  canonical: string;
  robots?: string;
  ogType?: "website" | "article";
  ogImage?: string;
  jsonLd?: Record<string, unknown>[];
};

const MANAGED_ATTR = "data-virgil-seo";

function upsertMeta(name: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"][${MANAGED_ATTR}="1"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    tag.setAttribute(MANAGED_ATTR, "1");
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function upsertProperty(property: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[property="${property}"][${MANAGED_ATTR}="1"]`
  );
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    tag.setAttribute(MANAGED_ATTR, "1");
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="canonical"][${MANAGED_ATTR}="1"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", "canonical");
    tag.setAttribute(MANAGED_ATTR, "1");
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
}

function upsertJsonLd(items: Record<string, unknown>[]) {
  const existing = Array.from(
    document.head.querySelectorAll<HTMLScriptElement>(`script[type="application/ld+json"][${MANAGED_ATTR}="1"]`)
  );
  existing.forEach((node) => node.remove());

  items.forEach((item) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute(MANAGED_ATTR, "1");
    script.text = JSON.stringify(item);
    document.head.appendChild(script);
  });
}

export function useSeo(config: SeoConfig) {
  useEffect(() => {
    document.title = config.title;
    upsertMeta("description", config.description);
    upsertMeta("robots", config.robots || "index,follow");
    upsertMeta("twitter:card", "summary_large_image");
    upsertMeta("twitter:title", config.title);
    upsertMeta("twitter:description", config.description);

    upsertProperty("og:title", config.title);
    upsertProperty("og:description", config.description);
    upsertProperty("og:type", config.ogType || "website");
    upsertProperty("og:url", config.canonical);
    if (config.ogImage) {
      upsertProperty("og:image", config.ogImage);
      upsertMeta("twitter:image", config.ogImage);
    }

    upsertCanonical(config.canonical);
    upsertJsonLd(config.jsonLd || []);
  }, [config]);
}
