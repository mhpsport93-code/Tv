import fetch from "node-fetch";

export default async function handler(req, res) {
  const TMDB_BASE = "https://api.themoviedb.org/3";
  const TMDB_IMAGE = "https://image.tmdb.org";
  const API_KEY = process.env.TMDB_API_KEY;
  const TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
  const PROXY_KEY = process.env.PROXY_KEY || "";

  // Optional security
  if (PROXY_KEY) {
    const key = req.headers["x-proxy-key"] || req.query._key;
    if (key !== PROXY_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    // image proxy support
    if (req.url.startsWith("/api/tmdb/image/")) {
      const imgPath = req.url.replace("/api/tmdb/image/", "");
      const imgUrl = `${TMDB_IMAGE}/${imgPath}`;
      const upstream = await fetch(imgUrl);
      const contentType = upstream.headers.get("content-type");
      res.setHeader("Content-Type", contentType);
      upstream.body.pipe(res);
      return;
    }

    // build TMDb URL
    const path = req.url.replace("/api/tmdb/", "");
    const params = new URLSearchParams(req.query);
    if (API_KEY) params.set("api_key", API_KEY);

    const url = `${TMDB_BASE}/${path}?${params.toString()}`;
    const headers = { Accept: "application/json" };
    if (TOKEN) headers["Authorization"] = `Bearer ${TOKEN}`;

    const response = await fetch(url, { headers });
    const data = await response.json();

    res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Proxy error", details: err.message });
  }
}
