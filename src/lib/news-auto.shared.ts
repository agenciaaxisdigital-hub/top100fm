// Feeds testados e confirmados funcionais (Câmara/Senado retornam 405/HTML)
const FEEDS = [
  { name: "Agência Brasil", url: "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml" },
  { name: "Agência Brasil – Política", url: "https://agenciabrasil.ebc.com.br/rss/politica/feed.xml" },
  { name: "Agência Brasil – Economia", url: "https://agenciabrasil.ebc.com.br/rss/economia/feed.xml" },
  { name: "Gov.br", url: "https://www.gov.br/noticias/RSS" },
];

const MAX_PER_FEED = 3;
const MAX_DAILY = 5;

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function stripHtml(s: string): string {
  let clean = decodeEntities(stripCdata(s));
  clean = clean.replace(/<script[\s\S]*?<\/script>/gi, "");
  clean = clean.replace(/<style[\s\S]*?<\/style>/gi, "");
  clean = clean.replace(/<[^>]*>/g, " ");
  return decodeEntities(clean).replace(/\s+/g, " ").trim();
}

function pickTag(item: string, tag: string): string {
  const m = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? stripCdata(m[1]) : "";
}

// Extrai URL de imagem do item RSS — suporta vários formatos de feed
function pickImage(item: string): string {
  // 1. Agência Brasil usa <imagem-destaque>URL</imagem-destaque>
  const imgDest = item.match(/<imagem-destaque[^>]*>([\s\S]*?)<\/imagem-destaque>/i);
  if (imgDest) {
    const url = imgDest[1].trim();
    if (url.startsWith("http")) return url;
  }

  // 2. <enclosure url="..." type="image/...">
  const enc =
    item.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i) ||
    item.match(/<enclosure[^>]*type="image[^"]*"[^>]*url="([^"]+)"/i);
  if (enc) return enc[1];

  // 3. <media:content> ou <media:thumbnail>
  const media =
    item.match(/<media:content[^>]*url="([^"]+)"/i) ||
    item.match(/<media:thumbnail[^>]*url="([^"]+)"/i);
  if (media) return media[1];

  // 4. <img src="..."> dentro de description ou content:encoded
  //    Decodifica entidades ANTES de buscar tags (RSS guarda HTML entity-encoded)
  const raw = pickTag(item, "content:encoded") || pickTag(item, "description");
  const decoded = decodeEntities(raw);
  const imgs = decoded.match(/<img[^>]*src="([^"]+)"/gi) || [];
  for (const imgTag of imgs) {
    const src = imgTag.match(/src="([^"]+)"/i)?.[1] || "";
    // Ignora logos, rastreadores e imagens 1px
    if (src && !/logo|loading|1px|1x1|tracking|\.gif(\?|$)|\.svg(\?|$)/i.test(src)) {
      return src;
    }
  }

  return "";
}

// Busca og:image da URL do artigo como último recurso (timeout 4s)
async function fetchOgImage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 RadioBot/1.0" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    const m =
      html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) ||
      html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/i);
    return m ? m[1] : "";
  } catch {
    return "";
  }
}

type ParsedItem = {
  title: string;
  summary: string;
  contentRich: string;
  link: string;
  image: string;
  source: string;
};

export type NewsIngestResult = {
  inserted: number;
  skipped: number;
  total: number;
};

function parseFeed(xml: string, source: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const itemRe = /<item[\s>][\s\S]*?<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRe.exec(xml)) && items.length < MAX_PER_FEED) {
    const it = match[0];
    const title = stripHtml(pickTag(it, "title"));
    const link = stripHtml(pickTag(it, "link"));
    const summary = stripHtml(pickTag(it, "description")).slice(0, 280);
    const contentRich = (
      stripHtml(pickTag(it, "content:encoded")) || stripHtml(pickTag(it, "description"))
    ).slice(0, 4000);
    const image = pickImage(it);
    if (title && link) items.push({ title, summary, contentRich, link, image, source });
  }
  return items;
}

async function fetchAndParse(): Promise<ParsedItem[]> {
  const all: ParsedItem[] = [];
  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "Mozilla/5.0 RadioBot/1.0" },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      // Descarta silenciosamente se não for XML (feed bloqueado retornando HTML)
      if (!xml.trim().startsWith("<?xml") && !xml.trim().startsWith("<rss") && !xml.includes("<item")) continue;
      all.push(...parseFeed(xml, feed.name));
    } catch (e) {
      console.error(`[news-auto] feed ${feed.name} failed`, e);
    }
  }
  return all;
}

export async function isAutoNewsEnabled(adminClient: any): Promise<boolean> {
  const { data, error } = await adminClient
    .from("site_settings")
    .select("*")
    .or("setting_key.eq.auto_news_enabled,key.eq.auto_news_enabled")
    .limit(1);

  if (error || !Array.isArray(data) || data.length === 0) return false;

  const row = data[0] as { setting_value?: unknown; value?: unknown };
  const raw = row.setting_value ?? row.value;
  return raw === true || raw === "true" || raw === '"true"';
}

async function countTodayAutoNews(adminClient: any): Promise<number> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const { count } = await adminClient
    .from("news")
    .select("*", { count: "exact", head: true })
    .eq("auto_generated", true)
    .gte("created_at", todayStart.toISOString());
  return count ?? 0;
}

export async function runNewsIngestWithClient(
  adminClient: any,
  opts?: { force?: boolean },
): Promise<NewsIngestResult> {
  const budget = opts?.force
    ? MAX_DAILY
    : MAX_DAILY - (await countTodayAutoNews(adminClient));
  if (budget <= 0) return { inserted: 0, skipped: 0, total: 0 };

  const items = await fetchAndParse();
  let inserted = 0;
  let skipped = 0;

  for (const it of items) {
    if (inserted >= budget) break;

    const { data: existing } = await adminClient
      .from("news")
      .select("id")
      .eq("source_url", it.link)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    // Se não veio imagem do RSS, tenta buscar og:image do artigo
    let image = it.image;
    if (!image && it.link) {
      image = await fetchOgImage(it.link);
    }

    const { error } = await adminClient.from("news").insert({
      title: it.title.slice(0, 180),
      summary: it.summary,
      content: `${it.contentRich}\n\nFonte: ${it.source}\n${it.link}`,
      image_url: image || null,
      source_url: it.link,
      source_name: it.source,
      auto_generated: true,
      is_published: true,
    });

    if (!error) inserted++;
    else console.error("[news-auto] insert error", error);
  }

  return { inserted, skipped, total: items.length };
}
