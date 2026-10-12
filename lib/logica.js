// Lógica de la lista compartida y las confirmaciones.
// Recibe un "store" con la interfaz de @upstash/redis (hgetall, hget, hset, hsetnx, hdel),
// así se puede probar con un store en memoria.

// Mismos ids que BASICOS en index.html. Si agregas un básico allá, agrégalo aquí también.
export const ITEMS = new Set([
  "asadera", "cocinilla1", "cocinilla2", "olla1", "olla2", "olla3", "sarten1", "sarten2",
  "tetera", "tabla", "pinzas", "fuego", "lavaloza", "basura",
  "cafe", "picoteo", "pan", "te", "leche", "agregados", "fruta",
  "botiquin",
]);

// Cosas que ya tienen dueño fijo y nadie más puede tomar (las lleva la cumpleañera).
const NEGRA = "La Negra";
export const FIJOS = {
  asadera: NEGRA, cocinilla1: NEGRA, olla1: NEGRA, sarten1: NEGRA, cafe: NEGRA, picoteo: NEGRA,
};

const limpiar = (s) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
const clave = (s) => limpiar(s).toLowerCase();

export async function leer(store) {
  const [basicos, rsvp] = await Promise.all([store.hgetall("basicos"), store.hgetall("rsvp")]);
  const asignados = { ...(basicos || {}), ...FIJOS };
  const respuestas = Object.values(rsvp || {})
    .map((v) => (typeof v === "string" ? JSON.parse(v) : v))
    .sort((a, b) => a.t - b.t);
  return {
    asignados,
    van: respuestas.filter((r) => r.respuesta === "si").map((r) => r.nombre),
    noVan: respuestas.filter((r) => r.respuesta === "no").map((r) => r.nombre),
  };
}

const error = (status, codigo, extra = {}) => ({ status, body: { ok: false, error: codigo, ...extra } });

export async function accion(store, body) {
  const nombre = limpiar(body?.nombre);
  if (!nombre) return error(400, "falta_nombre");

  if (body.accion === "rsvp") {
    const respuesta = body.respuesta === "si" ? "si" : body.respuesta === "no" ? "no" : null;
    if (!respuesta) return error(400, "respuesta_invalida");
    await store.hset("rsvp", { [clave(nombre)]: { nombre, respuesta, t: Date.now() } });
    if (respuesta === "no") {
      // Si no va, se liberan las cosas que había tomado.
      const basicos = (await store.hgetall("basicos")) || {};
      for (const [item, quien] of Object.entries(basicos)) {
        if (clave(quien) === clave(nombre)) await store.hdel("basicos", item);
      }
    }
    return { status: 200, body: { ok: true, ...(await leer(store)) } };
  }

  const item = String(body.item ?? "");
  if (!ITEMS.has(item)) return error(400, "item_invalido");
  if (FIJOS[item]) return error(409, "tomado", { por: FIJOS[item] });

  if (body.accion === "llevar") {
    const nuevo = await store.hsetnx("basicos", item, nombre);
    if (!nuevo) {
      const actual = await store.hget("basicos", item);
      if (clave(actual) !== clave(nombre)) return error(409, "tomado", { por: actual });
    }
    return { status: 200, body: { ok: true, ...(await leer(store)) } };
  }

  if (body.accion === "soltar") {
    const actual = await store.hget("basicos", item);
    if (actual && clave(actual) !== clave(nombre)) return error(403, "no_es_tuyo", { por: actual });
    if (actual) await store.hdel("basicos", item);
    return { status: 200, body: { ok: true, ...(await leer(store)) } };
  }

  return error(400, "accion_invalida");
}
