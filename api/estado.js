import { Redis } from "@upstash/redis";
import { leer, accion } from "../lib/logica.js";

// Acepta los nombres de variables que crea la integración de Upstash en Vercel.
function conectar() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const store = conectar();
  if (!store) return res.status(503).json({ ok: false, error: "sin_base_de_datos" });

  try {
    if (req.method === "GET") return res.status(200).json({ ok: true, ...(await leer(store)) });
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      const r = await accion(store, body);
      return res.status(r.status).json(r.body);
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "metodo_no_permitido" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "error_interno" });
  }
}
