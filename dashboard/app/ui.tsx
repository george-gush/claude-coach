"use client";

import { useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  ScatterChart as RScatter, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceDot } from "recharts";

export const SPORT_VAR: Record<string, string> = {
  Swim: "var(--swim)", Bike: "var(--bike)", Run: "var(--run)",
  Strength: "var(--strength)", Other: "var(--text-muted)",
};
export const METRIC_VAR: Record<string, string> = {
  hrv: "var(--swim)", restingHR: "var(--bike)", sleepH: "var(--strength)",
  readiness: "var(--run)", respiration: "var(--bike)", spO2: "var(--run)",
  sleepScore: "var(--run)", form: "var(--run)",
};
export const METRIC_LABEL: Record<string, string> = {
  hrv: "HRV", restingHR: "Resting HR", sleepH: "Sleep duration", readiness: "Readiness",
  respiration: "Breathing rate", spO2: "Blood oxygen", sleepScore: "Sleep score", form: "Form",
};
/** Metrics where a LOWER number is the better one. */
export const METRIC_INVERT: Record<string, boolean> = {
  restingHR: true, respiration: true, form: false,
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

export function Card({ title, sub, children, wide, onClick }: any) {
  const C: any = onClick ? "button" : "section";
  return (
    <C className={`card${onClick ? " clickable" : ""}`} onClick={onClick}
       style={wide ? { gridColumn: "1 / -1" } : undefined}>
      {title && <h2>{title}{sub && <span className="h2sub">{sub}</span>}{onClick && <span className="chev">→</span>}</h2>}
      {children}
    </C>
  );
}

/** Collapsed prose. The default view stays scannable; the words are one click away. */
export function Explain({ children, label = "Why this matters" }: any) {
  return (
    <details className="explain">
      <summary>{label}</summary>
      <div className="explainbody">{children}</div>
    </details>
  );
}

/** Straightforward tokens of data — read by scanning, not by reading. */
export function StatGrid({ stats }: { stats: { k: string; v: string }[] }) {
  return (
    <dl className="statgrid">
      {stats.map((s) => (
        <div key={s.k}><dt>{s.k}</dt><dd>{s.v}</dd></div>
      ))}
    </dl>
  );
}

/** A clickable metric tile. Number first, context second, always drillable. */
export function MetricTile({ label, value, unit = "", base, invert = false, hint, onClick }: any) {
  const z = base?.z;
  let tone = "flat";
  if (z != null && Math.abs(z) >= 0.8) tone = (invert ? z < 0 : z > 0) ? "up" : "down";
  return (
    <button className="metric clickable" onClick={onClick} disabled={!onClick}>
      <div className="mlabel">{label}{onClick && <span className="chev">→</span>}</div>
      <div className="mvalue">{value ?? "—"}<span className="munit">{unit}</span></div>
      {base?.mean != null && (
        <div className={`mdelta ${tone}`}>
          {z != null && <b>{z > 0 ? "+" : ""}{z}σ</b>}
          <span className="mbase">vs {base.mean}{unit} typical</span>
        </div>
      )}
      {hint && <div className="mhint">{hint}</div>}
    </button>
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
export function MonthlyChart({ data, dataKey, color, unit = "", domain, invert = false, height = 210 }: any) {
  const pts = data.filter((d: any) => d[dataKey] != null);
  const vals = pts.map((d: any) => d[dataKey]);
  if (vals.length < 2) return <div className="empty">Not enough months yet.</div>;
  const best = invert ? Math.min(...vals) : Math.max(...vals);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const pad = Math.max((hi - lo) * 0.25, hi * 0.02);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={pts} margin={{ top: 18, right: 14, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickFormatter={monthLabel} tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} unit={unit}
          domain={domain || [Math.floor(lo - pad), Math.ceil(hi + pad)]} />
        <Tooltip content={<Tip suffix={unit} />} labelFormatter={monthLabel} />
        <ReferenceLine y={best} stroke="var(--text-muted)" strokeDasharray="3 3"
          label={{ value: invert ? "best month" : "peak", position: "insideTopRight",
                   fill: "var(--text-muted)", fontSize: 10 }} />
        <Line type="monotone" dataKey={dataKey} name={METRIC_LABEL[dataKey] || dataKey} stroke={color} strokeWidth={2.4}
          dot={{ r: 3.5, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 5.5, stroke: "var(--surface-1)", strokeWidth: 2 }}
          isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Rolling 28-day line — smooths daily noise into the trend he cannot see. */
export function TrendLine({ data, series, height = 240, unit = "", refLine, refLabel, domain, mark }: any) {
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
          {mark && (
            <ReferenceLine x={mark} stroke="var(--critical)" strokeDasharray="4 4"
              label={{ value: shortDate(mark), position: "top", fill: "var(--critical)", fontSize: 11 }} />
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

/** Scatter with an OLS fit line — shows the relationship AND its spread, so a
 *  correlation is never taken on trust. */
export function ScatterPlot({ points, xLabel, yLabel, height = 240 }: any) {
  if (!points?.length) return <div className="empty">No paired data.</div>;
  const n = points.length;
  const mx = points.reduce((s: number, p: any) => s + p.x, 0) / n;
  const my = points.reduce((s: number, p: any) => s + p.y, 0) / n;
  let num = 0, den = 0;
  for (const p of points) { num += (p.x - mx) * (p.y - my); den += (p.x - mx) ** 2; }
  const slope = den ? num / den : 0;
  const xs = points.map((p: any) => p.x);
  const lo = Math.min(...xs), hi = Math.max(...xs);
  const fit = [{ x: lo, y: my + slope * (lo - mx) }, { x: hi, y: my + slope * (hi - mx) }];
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RScatter margin={{ top: 10, right: 14, left: -14, bottom: 16 }}>
        <CartesianGrid />
        <XAxis type="number" dataKey="x" name={xLabel} tickLine={false} axisLine={false}
          label={{ value: xLabel, position: "insideBottom", offset: -10, fill: "var(--text-muted)", fontSize: 11 }} />
        <YAxis type="number" dataKey="y" name={yLabel} tickLine={false} axisLine={false} domain={["dataMin - 0.4", "dataMax + 0.4"]} />
        <ZAxis range={[60, 60]} />
        <Tooltip content={({ active, payload }: any) => {
          if (!active || !payload?.length) return null;
          const p = payload[0].payload;
          return <div className="tip"><div className="r"><span className="lab">{xLabel}</span><span className="val">{p.x}</span></div>
            <div className="r"><span className="lab">{yLabel}</span><span className="val">{p.y}</span></div></div>;
        }} cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={points} fill="var(--swim)" fillOpacity={0.75} isAnimationActive={false} />
        <Scatter data={fit} line={{ stroke: "var(--critical)", strokeWidth: 2 }} shape={() => <g />} isAnimationActive={false} />
      </RScatter>
    </ResponsiveContainer>
  );
}

export function BarsChart({ points, unit = "", color = "var(--strength)", height = 210 }: any) {
  if (!points?.length) return <div className="empty">No data.</div>;
  const vals = points.map((p: any) => p.value);
  const hi = Math.max(...vals);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={points} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickFormatter={(v: string) => (v.length === 7 ? monthLabel(v) : v)}
          tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} unit={unit} domain={[0, Math.ceil(hi * 1.15 * 10) / 10]} />
        <Tooltip content={<Tip suffix={unit} />} cursor={{ fill: "var(--surface-2)" }}
          labelFormatter={(v: string) => (v.length === 7 ? monthLabel(v) : v)} />
        <Bar dataKey="value" name="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
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

/** Correlation strength bar — signed, so direction is visible. Clickable. */
export function CorrBar({ label, r, n, verdict, onClick }: any) {
  const w = r == null ? 0 : Math.min(Math.abs(r), 1) * 50;
  const weak = verdict === "no reliable relationship" || verdict === "sample too small to call" || verdict === "too few paired days";
  const C: any = onClick ? "button" : "div";
  return (
    <C className={`corr ${weak ? "weak" : ""}${onClick ? " clickable" : ""}`} onClick={onClick}>
      <div className="clab">{label}</div>
      <div className="ctrack">
        <span className="cmid" />
        {r != null && (
          <span className="cfill" style={{
            width: `${w}%`, left: r < 0 ? `${50 - w}%` : "50%",
            background: weak ? "var(--text-muted)" : r < 0 ? "var(--bike)" : "var(--run)",
          }} />
        )}
      </div>
      <div className="cval">{r == null ? "—" : `${r > 0 ? "+" : ""}${r}`}<small>n={n}</small></div>
    </C>
  );
}

const TONE: Record<string, string> = {
  critical: "Needs attention", watch: "Worth watching", good: "Going well", neutral: "Context",
};

/** The finding, reduced to one number and one line. Everything else is behind the click. */
export function InsightTile({ i, onClick }: any) {
  return (
    <button className={`tile ${i.severity}`} onClick={onClick}>
      <header>
        <span className="itag"><span className="sev" />{TONE[i.severity]}</span>
        <span className="chev">→</span>
      </header>
      <div className="tvalue">{i.headline.value}<span className="tunit">{i.headline.unit}</span></div>
      <h3>{i.claim}</h3>
      <p className="tcap">{i.headline.caption}</p>
      {i.action && <p className="taction">{i.action}</p>}
    </button>
  );
}

/** Slide-over detail. One per click, Esc or backdrop to close. */
export function Sheet({ open, onClose, title, eyebrow, children }: any) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheetwrap" role="dialog" aria-modal="true" aria-label={title}>
      <div className="backdrop" onClick={onClose} />
      <div className="sheet">
        <header className="sheethead">
          <div>
            {eyebrow && <div className="sheeteyebrow">{eyebrow}</div>}
            <h2>{title}</h2>
          </div>
          <button className="sheetclose" onClick={onClose} aria-label="Close">✕</button>
        </header>
        <div className="sheetbody">{children}</div>
      </div>
    </div>
  );
}
