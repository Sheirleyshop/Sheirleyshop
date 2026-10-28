// SHEIRLEY: adds the admin-chosen "Link Preview Image" to the page HTML so Facebook, WhatsApp, Messenger
// and Google can see it. Those crawlers do not run JavaScript, so this has to happen on the server.
//
// Safe by design: if anything goes wrong (Supabase slow/down, no image chosen, not an HTML page) the page is
// returned exactly as it is, so the shop can never break because of this file.

const SUPABASE_URL = "https://ebloczrdbvvjdfifxrpk.supabase.co";
// Public "anon" key (the same one already inside index.html; it is meant to be public).
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVibG9jenJkYnZ2amRmaWZ4cnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MzU3NzEsImV4cCI6MjEwNjExMTc3MX0.6WM4QFcF4lY0aIokMUK9xQS6AI_lk3cIfC9xfeusZVY";
const CACHE_SECONDS = 300;   // the image is looked up at most once every 5 minutes

function esc(s){
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function getShareImage(ctx){
  const cache = caches.default;
  const cacheKey = new Request("https://share-preview.internal/v1");
  try{
    const hit = await cache.match(cacheKey);
    if(hit){ const j = await hit.json(); return j.image || null; }
  }catch(e){}
  let image = null;
  try{
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 2000);
    const r = await fetch(SUPABASE_URL + "/rest/v1/rpc/get_share_preview", {
      method: "POST",
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": "Bearer " + SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: "{}",
      signal: ac.signal
    });
    clearTimeout(t);
    if(!r.ok) return null;                      // do not cache failures
    const j = await r.json();
    image = (j && typeof j.image === "string" && /^https:\/\//.test(j.image)) ? j.image : null;
  }catch(e){ return null; }
  try{
    ctx.waitUntil(cache.put(cacheKey, new Response(JSON.stringify({ image }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "max-age=" + CACHE_SECONDS }
    })));
  }catch(e){}
  return image;
}

export default {
  async fetch(request, env, ctx){
    const res = await env.ASSETS.fetch(request);
    try{
      const type = res.headers.get("content-type") || "";
      if(request.method !== "GET" || res.status !== 200 || type.indexOf("text/html") === -1) return res;
      const image = await getShareImage(ctx);
      if(!image) return res;
      const safe = esc(image);
      return new HTMLRewriter()
        .on("head", { element(el){
          el.append('<meta property="og:image" content="' + safe + '"><meta name="twitter:image" content="' + safe + '">', { html: true });
        }})
        .on('meta[name="twitter:card"]', { element(el){ el.setAttribute("content", "summary_large_image"); } })
        .transform(res);
    }catch(e){
      return res;
    }
  }
};
