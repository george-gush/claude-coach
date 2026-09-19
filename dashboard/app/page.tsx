"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, ComposedChart, Area,
} from "recharts";

const SPORT_VAR: Record<string, string> = {
  Swim: "var(--swim)", Bike: "var(--bike)", Run: "var(--run)",
  Strength: "var(--strength)", Other: "var(--text-muted)",
};
const TABS = ["Today", "Week", "Trends", "Sessions"] as const;
type Tab = (typeof TABS)[number];

const pace = (s: number | null) =>
  s == null ? "—" : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}/km`;
const hm = (m: number | null) => (m == null ? "—" : m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);
const shortDate = (d: string) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const dayName = (d: string) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });

function Tip({ active, payload, label, unit = "", fmt }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tip">
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.filter((p: any) => p.value != null).map((p: any) => (
        <div className="r" key={p.dataKey}>
          <span className="lab">
            <i style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: p.color, marginRight: 6 }} />
            {p.name}
          </span>
          <span>{fmt ? fmt(p.value) : `${p.value}${unit}`}</span>
        </div>
      ))}
    </div>
  );
}

function Legend({ items }: { items: [string, string][] }) {
  return (
    <div className="legend">
      {items.map(([name, color]) => (
        <span key={name}><i style={{ background: color }} />{name}</span>
      ))}
    </div>
  );
}

function Stat({ k, v, d }: { k: string; v: React.ReactNode; d?: string }) {
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
      {d && <div className="d">{d}</div>}
    </div>
  );
}

export default function Page() {
  const [tab, setTab] = useState<Tab>("Today");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => (d.error ? setErr(d.error) : setData(d)))
      .catch((e) => setErr(String(e)));
  }, []);

  const weeks8 = useMemo(
    () => (data?.weekly || []).slice(-8).map((w: any) => ({ ...w, label: shortDate(w.week) })),
    [data]
  );
  const wellness60 = useMemo(
    () => (data?.wellness || []).slice(-60).map((w: any) => ({ ...w, label: shortDate(w.date) })),
    [data]
  );

  if (err)
    return (
      <div className="wrap">
        <div className="err">
          <strong>Could not load data.</strong>
          <div style={{ marginTop: 6 }}>{err}</div>
          <div style={{ marginTop: 10, color: "var(--text-muted)" }}>
            Most likely <code>INTERVALS_API_KEY</code> is not set on the Vercel project.
          </div>
        </div>
      </div>
    );
  if (!data) return <div className="wrap"><div className="skeleton">Loading your training data…</div></div>;

  const r = data.readiness;
  const todayISO = new Date().toISOString().slice(0, 10);
  const todaysSessions = (data.upcoming || []).filter((u: any) => u.date === todayISO);
  const nextUp = (data.upcoming || []).filter((u: any) => u.date > todayISO).slice(0, 6);

  return (
    <div className="wrap">
      <header className="top">
        <div>
          <h1>Training Dashboard</h1>
          <div className="sub">
            {data.race.name} · {shortDate(data.race.date)} · updated{" "}
            {new Date(data.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <span className={`pill ${r.status}`}><span className="dot" />{r.status.toUpperCase()}</span>
      </header>

      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>
        ))}
      </nav>

      {/* ---------------------------------------------------------- TODAY */}
      {tab === "Today" && (
        <div className="grid two">
          <div className="card">
            <h2>Days to race</h2>
            <div className="hero">{data.race.daysToRace}<small>days</small></div>
            <div className="note">
              {data.race.name}, {shortDate(data.race.date)} at {data.race.start}. Olympic distance —
              1.5 km open-water swim, no wetsuit · 40 km bike · 10 km run.
            </div>
          </div>

          <div className="card">
            <h2>Readiness</h2>
            <span className={`pill ${r.status}`}><span className="dot" />{r.status.toUpperCase()}</span>
            <ul style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {r.reasons.map((x: string, i: number) => <li key={i}>{x}</li>)}
            </ul>
          </div>

          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <h2>Recovery markers</h2>
            <div className="statrow">
              <Stat k="Sleep, 7-day" v={r.sleep7 != null ? `${r.sleep7} h` : "—"} d="target 7.5 h" />
              <Stat k="HRV, 7-day" v={r.hrv7 ?? "—"} d={r.hrv60 != null ? `baseline ${r.hrv60}` : undefined} />
              <Stat k="Resting HR" v={r.rhr7 ?? "—"} d="7-day average" />
              <Stat k="Form" v={r.form ?? "—"} d={`fitness ${r.ctl ?? "—"} · fatigue ${r.atl ?? "—"}`} />
            </div>
            <div className="note">
              Form is fitness minus fatigue. Consistently negative means fatigue is never being absorbed.
              Sleep is the binding constraint here — it moves HRV more than training does.
            </div>
          </div>

          <div className="card">
            <h2>Today</h2>
            {todaysSessions.length ? (
              <div className="list">
                {todaysSessions.map((s: any, i: number) => (
                  <div className="item" key={i}>
                    <span className="when">{s.time || "—"}</span>
                    <span className="what">
                      <span className="sportdot" style={{ background: SPORT_VAR[s.sport] }} />{s.name}
                    </span>
                    <span className="dur">{hm(s.minutes)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="note" style={{ marginTop: 0 }}>Nothing scheduled. Rest day — that is a session too.</div>
            )}
          </div>

          <div className="card">
            <h2>Coming up</h2>
            <div className="list">
              {nextUp.length ? nextUp.map((s: any, i: number) => (
                <div className="item" key={i}>
                  <span className="when">{dayName(s.date)} {s.time}</span>
                  <span className="what">
                    <span className="sportdot" style={{ background: SPORT_VAR[s.sport] }} />{s.name}
                  </span>
                  <span className="dur">{hm(s.minutes)}</span>
                </div>
              )) : <div className="note" style={{ marginTop: 0 }}>Nothing planned yet.</div>}
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- WEEK */}
      {tab === "Week" && (
        <div className="grid">
          <div className="card">
            <h2>Planned against actual — last 7 days</h2>
            <table>
              <thead>
                <tr><th>Day</th><th>Session</th><th className="num">Planned</th><th className="num">Actual</th><th className="num">Done</th></tr>
              </thead>
              <tbody>
                {(data.compliance || []).length ? data.compliance.map((c: any, i: number) => (
                  <tr key={i}>
                    <td>{dayName(c.date)} {shortDate(c.date)}</td>
                    <td><span className="sportdot" style={{ background: SPORT_VAR[c.sport] }} />{c.name}</td>
                    <td className="num">{hm(c.plannedMin)}</td>
                    <td className="num">{c.actualMin != null ? hm(c.actualMin) : "—"}</td>
                    <td className="num" style={{ color: c.done ? "var(--good)" : "var(--text-muted)" }}>
                      {c.done ? "yes" : "no"}
                    </td>
                  </tr>
                )) : <tr><td colSpan={5}>No planned sessions in the last 7 days.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2>Weekly volume by sport — minutes</h2>
            <Legend items={[["Swim", "var(--swim)"], ["Bike", "var(--bike)"], ["Run", "var(--run)"], ["Strength", "var(--strength)"]]} />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeks8} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip content={<Tip fmt={(v: number) => hm(v)} />} cursor={{ fill: "var(--surface-2)" }} />
                <Bar dataKey="Swim" stackId="a" fill="var(--swim)" />
                <Bar dataKey="Bike" stackId="a" fill="var(--bike)" />
                <Bar dataKey="Run" stackId="a" fill="var(--run)" />
                <Bar dataKey="Strength" stackId="a" fill="var(--strength)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- TRENDS */}
      {tab === "Trends" && (
        <div className="grid">
          <div className="card">
            <h2>Longest run each week — the limiter</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeks8} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} unit=" km" domain={[0, (m: number) => Math.max(11, Math.ceil(m))]} />
                <Tooltip content={<Tip fmt={(v: number) => `${v} km`} />} cursor={{ fill: "var(--surface-2)" }} />
                <ReferenceLine y={10} stroke="var(--critical)" strokeDasharray="4 4"
                  label={{ value: "race 10 km", position: "insideTopRight", fill: "var(--text-muted)", fontSize: 11 }} />
                <Bar dataKey="longestRunKm" name="Longest run" fill="var(--run)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="note">
              This is <strong>session distance</strong>, including walk breaks — not continuous running.
              The race run is planned as run-walk, so this is the number that matters.
            </div>
          </div>

          <div className="card">
            <h2>Sleep — last 60 days</h2>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={wellness60} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={40} />
                <YAxis tickLine={false} axisLine={false} unit=" h" domain={[3, 10]} />
                <Tooltip content={<Tip fmt={(v: number) => `${v} h`} />} />
                <ReferenceLine y={7.5} stroke="var(--good)" strokeDasharray="4 4"
                  label={{ value: "target 7.5 h", position: "insideBottomRight", fill: "var(--text-muted)", fontSize: 11 }} />
                <Line type="monotone" dataKey="sleepH" name="Sleep" stroke="var(--swim)" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
            <div className="note">
              Almost every night sits below the target line. This is the single biggest lever you have.
            </div>
          </div>

          <div className="card">
            <h2>HRV — last 60 days</h2>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={wellness60} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={40} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip content={<Tip />} />
                {r.hrv60 != null && (
                  <ReferenceLine y={r.hrv60} stroke="var(--text-muted)" strokeDasharray="4 4"
                    label={{ value: "60-day baseline", position: "insideBottomRight", fill: "var(--text-muted)", fontSize: 11 }} />
                )}
                <Line type="monotone" dataKey="hrv" name="HRV" stroke="var(--bike)" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
            <div className="note">
              Separate chart on its own scale — sleep and HRV have different ranges and sharing an axis would
              flatten sleep into a straight line. Read the trend against the baseline, never a single day.
            </div>
          </div>

          <div className="card">
            <h2>Fitness, fatigue and form</h2>
            <Legend items={[["Fitness", "var(--swim)"], ["Fatigue", "var(--bike)"], ["Form", "var(--run)"]]} />
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={wellness60} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={40} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip content={<Tip />} />
                <ReferenceLine y={0} stroke="var(--text-muted)" />
                <Area type="monotone" dataKey="form" name="Form" fill="var(--run)" stroke="var(--run)" fillOpacity={0.16} strokeWidth={2} connectNulls />
                <Line type="monotone" dataKey="ctl" name="Fitness" stroke="var(--swim)" strokeWidth={2} dot={false} connectNulls />
                <Line type="monotone" dataKey="atl" name="Fatigue" stroke="var(--bike)" strokeWidth={2} dot={false} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="note">
              Form below zero means fatigue outweighs fitness. It should go positive in the taper, roughly 2 November.
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------- SESSIONS */}
      {tab === "Sessions" && (
        <div className="card">
          <h2>Every session — tap a row for detail</h2>
          <Legend items={[["Swim", "var(--swim)"], ["Bike", "var(--bike)"], ["Run", "var(--run)"], ["Strength", "var(--strength)"]]} />
          <table>
            <thead>
              <tr><th>Date</th><th>Session</th><th className="num">Time</th><th className="num">km</th><th className="num">Pace/Speed</th></tr>
            </thead>
            <tbody>
              {(data.activities || []).slice(0, 80).map((a: any, i: number) => (
                <>
                  <tr key={a.id || i} className="sessionrow" onClick={() => setOpen(open === i ? null : i)}>
                    <td>{shortDate(a.date)}</td>
                    <td><span className="sportdot" style={{ background: SPORT_VAR[a.sport] }} />{a.name || a.sport}</td>
                    <td className="num">{hm(a.minutes)}</td>
                    <td className="num">{a.km || "—"}</td>
                    <td className="num">{a.sport === "Run" ? pace(a.paceSecPerKm) : a.kph ? `${a.kph} kph` : "—"}</td>
                  </tr>
                  {open === i && (
                    <tr className="detail" key={`d${i}`}>
                      <td colSpan={5}>
                        <strong>{a.type}</strong> · avg HR {a.hr ?? "—"} · max HR {a.maxHr ?? "—"} · load {a.load ?? "—"}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="sub" style={{ marginTop: 18, textAlign: "center" }}>
        Data from intervals.icu — Garmin activities and Whoop recovery. Rows with no sport or zero duration are filtered out.
      </div>
    </div>
  );
}
