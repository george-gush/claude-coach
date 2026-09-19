"use client";

import { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea } from "recharts";

export const SPORT_VAR: Record<string, string> = {
  Swim: "var(--swim)", Bike: "var(--bike)", Run: "var(--run)",
  Strength: "var(--strength)", Other: "var(--text-muted)",
};

export const f1 = (n: any) => (n == null ? "—" : Math.round(n * 10) / 10);
export const f2 = (n: any) => (n == null ? "—" : Math.round(n * 100) / 100);
export const hm = (m: any) => (m == null ? "—" : m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);
export const pace = (s: any) => (s == null ? "—" : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}/km`);
export const shortDate = (d: string) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
export const monthLabel = (m: string) =>
  new Date(m + "-01T00:00:00Z").toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });

export function Tip({ active, payload, label, fmt, suffix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tip">
      <div className="tiplabel">{label}</div>
      {payload.filter((p: any) => p.value != null).map((p: any) => (
        <div className="r" key={p.dataKey}>
          <span className="lab"><i style={{ background: p.color }} />{p.name}</span>
          <span className="val">{fmt ? fmt(p.value) : p.value}{suffix}</span>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: [string, string][] }) {
  if (items.length < 2) return null;
  return (
    <div className="legend">
      {items.map(([name, color]) => (<span key={name}><i style={{ background: color }} />{name}</span>))}
    </div>
  );
}

export function Card({ title, sub, children, wide }: any) {
  return (
    <section className="card" style={wide ? { gridColumn: "1 / -1" } : undefined}>
      {title && <h2>{title}{sub && <span className="h2sub">{sub}</span>}</h2>}
      {children}
    </section>
  );
}

/** Big number with its own-history context. */
export function Metric({ label, value, unit = "", base, invert = false, hint }: any) {
  const z = base?.z;
  let tone = "flat";
  if (z != null && Math.abs(z) >= 0.8) {
    const better = invert ? z < 0 : z > 0;
    tone = better ? "up" : "down";
  }
  return (
    <div className="metric">
      <div className="mlabel">{label}</div>
      <div className="mvalue">{value ?? "—"}<span className="munit">{unit}</span></div>
      {base?.mean != null && (
        <div className={`mdelta ${tone}`}>
          {z != null && <b>{z > 0 ? "+" : ""}{z}σ</b>}
          <span className="mbase">vs {base.mean}{unit} typical</span>
        </div>
      )}
      {hint && <div className="mhint">{hint}</div>}
    </div>
  );
}

export function Spark({ data, dataKey, color = "var(--swim)", height = 44 }: any) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 3, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.6}
          fill={`url(#g-${dataKey})`} dot={false} connectNulls isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Monthly metric chart. Deliberately a line with dots, not bars: month-to-month
 *  differences here are small relative to the absolute value, and a bar chart on a
 *  truncated axis would exaggerate them (and renders anything at the axis floor as
 *  an invisible zero-height bar). A line carries no zero-baseline implication. */
export function MonthlyChart({ data, dataKey, color, unit = "", domain, invert = false }: any) {
  const pts = data.filter((d: any) => d[dataKey] != null);
  const vals = pts.map((d: any) => d[dataKey]);
  if (vals.length < 2) return <div className="empty">Not enough months yet.</div>;
  const best = invert ? Math.min(...vals) : Math.max(...vals);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = Math.max((hi - lo) * 0.25, hi * 0.02);
  return (
    <ResponsiveContainer width="100%" height={210}>
      <LineChart data={pts} margin={{ top: 18, right: 14, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickFormatter={monthLabel} tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} unit={unit}
          domain={domain || [Math.floor(lo - pad), Math.ceil(hi + pad)]} />
        <Tooltip content={<Tip suffix={unit} />} labelFormatter={monthLabel} />
        <ReferenceLine y={best} stroke="var(--text-muted)" strokeDasharray="3 3"
          label={{ value: invert ? "best month" : "peak", position: "insideTopRight",
                   fill: "var(--text-muted)", fontSize: 10 }} />
        <Line type="monotone" dataKey={dataKey} name={dataKey} stroke={color} strokeWidth={2.4}
          dot={{ r: 3.5, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 5.5, stroke: "var(--surface-1)", strokeWidth: 2 }}
          isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Rolling 28-day line — smooths daily noise into the trend he cannot see. */
export function TrendLine({ data, series, height = 240, unit = "", refLine, refLabel, domain }: any) {
  return (
    <>
      <Legend items={series.map((s: any) => [s.name, s.color])} />
      <ResponsiveContainer width="100%" height={height}>
        <LineChart margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" type="category" allowDuplicatedCategory={false}
            tickFormatter={shortDate} tickLine={false} axisLine={false} minTickGap={44} />
          <YAxis tickLine={false} axisLine={false} unit={unit} domain={domain || ["auto", "auto"]} />
          <Tooltip content={<Tip suffix={unit} />} labelFormatter={shortDate} />
          {refLine != null && (
            <ReferenceLine y={refLine} stroke="var(--good)" strokeDasharray="4 4"
              label={{ value: refLabel, position: "insideBottomRight", fill: "var(--text-muted)", fontSize: 11 }} />
          )}
          {series.map((s: any) => (
            <Line key={s.name} data={s.data} dataKey="value" name={s.name} stroke={s.color}
              strokeWidth={2.2} dot={false} connectNulls isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}

export function InsightCard({ i }: any) {
  const TONE: any = { critical: "Needs attention", watch: "Worth watching", good: "Going well", neutral: "Context" };
  return (
    <article className={`insight ${i.severity}`}>
      <header>
        <span className="itag">{TONE[i.severity]}</span>
        <span className="iconf">{i.confidence}</span>
      </header>
      <h3>{i.title}</h3>
      <p>{i.body}</p>
      <footer>{i.evidence}</footer>
    </article>
  );
}

/** Correlation strength bar — signed, so direction is visible. */
export function CorrBar({ label, r, n, verdict }: any) {
  const w = r == null ? 0 : Math.min(Math.abs(r), 1) * 50;
  const weak = verdict === "no reliable relationship" || verdict === "sample too small to call" || verdict === "too few paired days";
  return (
    <div className={`corr ${weak ? "weak" : ""}`}>
      <div className="clab">{label}</div>
      <div className="ctrack">
        <span className="cmid" />
        {r != null && (
          <span className="cfill" style={{
            width: `${w}%`,
            left: r < 0 ? `${50 - w}%` : "50%",
            background: weak ? "var(--text-muted)" : r < 0 ? "var(--bike)" : "var(--run)",
          }} />
        )}
      </div>
      <div className="cval">{r == null ? "—" : `${r > 0 ? "+" : ""}${r}`}<small>n={n}</small></div>
    </div>
  );
}

export function WeekdayChart({ data, color, unit = "" }: any) {
  const vals = data.map((d: any) => d.value).filter((v: any) => v != null);
  if (vals.length < 5) return <div className="empty">Not enough data.</div>;
  const lo = Math.min(...vals), hi = Math.max(...vals);
  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} domain={[Math.floor(lo * 0.94), Math.ceil(hi * 1.03)]} unit={unit} />
        <Tooltip content={<Tip suffix={unit} />} cursor={{ fill: "var(--surface-2)" }} />
        <Bar dataKey="value" name="avg" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
