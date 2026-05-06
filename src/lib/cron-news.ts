import { runAutoNewsIngest } from "@/lib/news-auto.server";

export const CRON_NEWS_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Cron-Secret",
};

export async function handleCronNewsRequest(request: Request): Promise<Response> {
  const expected = process.env.CRON_SECRET;

  // Vercel injeta x-vercel-cron: 1 em chamadas originárias do próprio cron — sempre permitido.
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";

  if (!isVercelCron && expected) {
    const url = new URL(request.url);
    const provided =
      request.headers.get("x-cron-secret") ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      url.searchParams.get("secret");

    if (provided !== expected) {
      return Response.json(
        { error: "Não autorizado" },
        { status: 401, headers: CRON_NEWS_CORS },
      );
    }
  }

  try {
    const result = await runAutoNewsIngest();
    return Response.json({ ok: true, ...result }, { headers: CRON_NEWS_CORS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro";
    return Response.json(
      { ok: false, error: message },
      { status: 500, headers: CRON_NEWS_CORS },
    );
  }
}
