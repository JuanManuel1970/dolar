import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

/* ===============================
   Config y utilidades
   =============================== */
const SOURCES = {
  bluelytics: {
    now: "https://api.bluelytics.com.ar/v2/latest",
    history: "https://api.bluelytics.com.ar/v2/evolution.json",
  },
};

const TYPE_LABEL = {
  blue: "Dólar Blue",
  oficial: "Dólar Oficial",
};

const RANGE_OPTIONS = [7, 30, 60, 90];
const TYPE_OPTIONS = ["blue", "oficial"];

const fmt = (n) =>
  n != null && isFinite(+n)
    ? Number(n).toLocaleString("es-AR", { maximumFractionDigits: 2 })
    : "—";

const timeAgo = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  return `hace ${h} h`;
};

// fetch con fallback simple a allorigins para CORS
async function safeFetch(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r;
  } catch (_) {
    const p = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
    const r2 = await fetch(p);
    if (!r2.ok) throw new Error("HTTP " + r2.status);
    return r2;
  }
}

/* ===============================
   App
   =============================== */
export default function App() {
  const [type, setType] = useState("blue");
  const [range, setRange] = useState(60);

  const [now, setNow] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const [hist, setHist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, range]);

  async function loadAll() {
    try {
      setLoading(true);
      setErr("");

      // Now
      const res = await safeFetch(SOURCES.bluelytics.now);
      const j = await res.json();
      const nowMap = type === "blue" ? j.blue : j.oficial;
      setNow({
        compra: Number(nowMap?.value_buy ?? nowMap?.compra ?? nowMap?.bid),
        venta: Number(nowMap?.value_sell ?? nowMap?.venta ?? nowMap?.ask),
        promedio: Number(
          (nowMap?.value_buy ?? 0 + nowMap?.value_sell ?? 0) / 2
        ),
      });
      setLastUpdate(j?.last_update || null);

      // History
      const hres = await safeFetch(SOURCES.bluelytics.history);
      const hjson = await hres.json();

      let series = [];
      if (Array.isArray(hjson)) {
        // puede venir como:
        // [{date, blue:{...}, oficial:{...}}]  (forma B)
        // o plano: [{date, source:'Blue'|'Oficial', ...}] (forma C)
        const looksC = hjson.length && typeof hjson[0]?.source === "string";

        if (looksC) {
          const target = type === "blue" ? "blue" : "oficial";
          series = hjson
            .filter((d) =>
              target === "blue"
                ? String(d.source).toLowerCase().includes("blue")
                : String(d.source).toLowerCase().includes("oficial")
            )
            .map((d) => normalizePoint(d.date, d.value_buy, d.value_sell, d.value_avg));
        } else {
          series = hjson
            .map((row) => {
              const node = row?.[type] || {};
              return normalizePoint(
                row?.date,
                node.value_buy ?? node.buy ?? node.bid,
                node.value_sell ?? node.sell ?? node.ask,
                node.value_avg
              );
            })
            .filter(Boolean);
        }
      } else if (hjson && (hjson.blue || hjson.oficial)) {
        // forma A: {blue:[...],oficial:[...]}
        const arr = type === "blue" ? hjson.blue : hjson.oficial;
        series = (arr || [])
          .map((d) => normalizePoint(d.date, d.value_buy, d.value_sell, d.value_avg))
          .filter(Boolean);
      }

      // ordenar y recortar
      series.sort((a, b) => (a.date < b.date ? -1 : 1));
      const lastN = Math.max(1, Number(range) || 30);
      setHist(series.slice(-lastN));
    } catch (e) {
      setErr("No se pudo cargar la información. Probá más tarde.");
      setNow(null);
      setHist([]);
    } finally {
      setLoading(false);
    }
  }

  const headerSubtitle = useMemo(
    () => "Cotizaciones Bluelytics (React + Recharts)",
    []
  );

  async function copyNow() {
    if (!now) return;
    const text = `${TYPE_LABEL[type]} — Compra: $${fmt(now.compra)} · Venta: $${fmt(
      now.venta
    )} · Promedio: $${fmt(now.promedio)}`;
    try {
      await navigator.clipboard.writeText(text);
      alert("Cotización copiada al portapapeles.");
    } catch {
      alert("No se pudo copiar.");
    }
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="dot" />
          <span className="title">Dólar Tracker AR</span>
        </div>
        <div className="subtitle">{headerSubtitle}</div>

        <div className="toolbar">
          <select
            className="select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
          >
            {RANGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} días
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="container">
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">{TYPE_LABEL[type]}</h2>
            <span className="badge">{timeAgo(lastUpdate)}</span>
          </div>

          {loading && <div className="muted">Cargando...</div>}
          {err && <div className="error">{err}</div>}

          {!loading && !err && now && (
            <>
              <div className="values">
                <div>
                  <div className="label">Compra</div>
                  <div className="value">${fmt(now.compra)}</div>
                </div>
                <div>
                  <div className="label">Venta</div>
                  <div className="value">${fmt(now.venta)}</div>
                </div>
                <div>
                  <div className="label">Promedio</div>
                  <div className="value">${fmt(now.promedio)}</div>
                </div>
              </div>

              <button className="link" onClick={copyNow}>
                Copiar cotización
              </button>
            </>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h3 className="card-title">
              Histórico {range} días — {TYPE_LABEL[type]}
            </h3>
          </div>

          {hist.length === 0 ? (
            <div className="muted">Sin datos.</div>
          ) : (
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={hist}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="compra"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="promedio"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="venta"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <footer className="footer">
          Hecho por Juanma — Fuente: api.bluelytics.com.ar
        </footer>
      </main>
    </div>
  );
}

/* ===============================
   Helpers
   =============================== */
function normalizePoint(dateStr, buyRaw, sellRaw, avgRaw) {
  if (!dateStr) return null;
  const date = String(dateStr).slice(0, 10);

  const toNum = (x) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
    // si no hay número, devolvemos null
  };

  const buy = toNum(buyRaw);
  const sell = toNum(sellRaw);
  let avg = toNum(avgRaw);

  if (avg == null) {
    if (buy != null && sell != null) avg = (buy + sell) / 2;
    else if (buy != null) avg = buy;
    else if (sell != null) avg = sell;
  }
  if (avg == null && buy == null && sell == null) return null;

  return {
    date,
    compra: buy != null ? buy : avg,
    venta: sell != null ? sell : avg,
    promedio: avg,
  };
}
