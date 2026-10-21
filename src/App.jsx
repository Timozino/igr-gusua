import { useEffect, useMemo, useState } from "react";
import { AreaChart, Columns, Donut, Gauge, Heatmap, HBars, PALETTE, Sparkline, monthSeries } from "./Charts";
import "./App.css";

const CATEGORIES = ["Tax Returns", "Assessments", "Receipts", "Correspondence", "Legal", "Audit Reports", "Human Resources"];
const DEPARTMENTS = ["Assessment", "Collections", "Audit", "Legal", "Administration"];
const LEVELS = ["Public", "Internal", "Confidential"];
const USERS = [
  { id: "u1", name: "Hajiya Maryam Bello", role: "Administrator" },
  { id: "u2", name: "Mr. Sani Garba", role: "Records Officer" },
  { id: "u3", name: "Mr. Ukasha Aminu Aliyu", role: "Staff" },
];
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z" },
  { id: "documents", label: "Documents", icon: "M6 2h8l5 5v15H6zM14 2v5h5" },
  { id: "upload", label: "Upload", icon: "M12 16V4M7 9l5-5 5 5M4 20h16" },
  { id: "archive", label: "Archive", icon: "M3 4h18v5H3zM5 9v11h14V9M10 13h4" },
  { id: "audit", label: "Audit log", icon: "M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z", admin: true },
];

const TITLES = ["Tax return batch", "Assessment notice", "Receipts register", "Official letter", "Legal opinion", "Audit report", "Staff record"];
const seed = Array.from({ length: 28 }, (_, i) => {
  const ci = (i * 3) % CATEGORIES.length;
  const at = new Date(2026, 9, 20, 11, 16);
  at.setDate(at.getDate() - Math.floor((i * i) / 6 + i * 2));
  return {
    id: "d" + (i + 1), ref: `IRS/GUS/2026/${String(i + 1).padStart(4, "0")}`,
    title: `${TITLES[ci]}, ${at.toLocaleString("en-GB", { month: "long", year: "numeric" })}`,
    category: CATEGORIES[ci], department: DEPARTMENTS[(i * 2) % DEPARTMENTS.length],
    level: LEVELS[[1, 1, 0, 2, 1, 1, 0][i % 7]], docDate: at.toISOString().slice(0, 10),
    by: USERS[i % 3].id, addedAt: at.toISOString(), status: i % 4 === 3 ? "archived" : "active",
    description: "", fileName: "", fileUrl: "",
  };
});

const load = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) || fallback; } catch { return fallback; }
};
const fmt = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const who = (id) => USERS.find((u) => u.id === id)?.name || "Unknown";

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function Login({ onLogin }) {
  const [id, setId] = useState(USERS[0].id);
  return (
    <main className="login">
      <form className="login-card" onSubmit={(e) => { e.preventDefault(); onLogin(USERS.find((u) => u.id === id)); }}>
        <div className="logo">IRS</div>
        <h1>Document Archive</h1>
        <p className="muted">Internal Revenue System, Gusau</p>
        <label>Sign in as
          <select value={id} onChange={(e) => setId(e.target.value)}>
            {USERS.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
        </label>
        <button className="btn primary block" type="submit">Sign in</button>
      </form>
    </main>
  );
}

function Kpi({ label, value, values, color, note }) {
  return (
    <div className="card kpi" style={{ "--accent": color }}>
      <span className="muted">{label}</span>
      <strong>{value}</strong>
      <small className="note">{note}</small>
      <Sparkline values={values} color={color} />
    </div>
  );
}

function Panel({ title, sub, className = "", children }) {
  return (
    <section className={`card panel ${className}`}>
      <header><h2>{title}</h2>{sub && <small className="muted">{sub}</small>}</header>
      {children}
    </section>
  );
}

function Dashboard({ docs, open, user }) {
  const total = docs.length;
  const archived = docs.filter((d) => d.status === "archived");
  const conf = docs.filter((d) => d.level === "Confidential");
  const months = monthSeries(docs, 6);
  const m = (list) => monthSeries(list, 6).map((x) => x.value);
  const cur = months[5].value, prev = months[4].value;
  const delta = prev ? Math.round(((cur - prev) / prev) * 100) : 0;
  const cats = CATEGORIES.map((c, i) => ({ label: c, value: docs.filter((d) => d.category === c).length, color: PALETTE[i % PALETTE.length] }));
  const deps = DEPARTMENTS.map((c) => ({ label: c, value: docs.filter((d) => d.department === c).length }));
  const lvls = LEVELS.map((c, i) => ({ label: c, value: docs.filter((d) => d.level === c).length, color: ["#9ad1b3", "#1f8a5b", "#f28c28"][i] }));
  const people = USERS.map((u) => ({ label: u.name, value: docs.filter((d) => d.by === u.id).length }));
  const recent = [...docs].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 5);
  const pct = total ? Math.round((archived.length / total) * 100) : 0;
  return (
    <>
      <section className="hero">
        <div>
          <p>Welcome back</p>
          <h2>{user.name}</h2>
          <span>{cur} records added this month, {delta >= 0 ? "up" : "down"} {Math.abs(delta)}% on last month.</span>
        </div>
        <div className="hero-num"><b>{total}</b><small>records secured</small></div>
      </section>
      <div className="kpis">
        <Kpi label="Total records" value={total} values={m(docs)} color="#1f8a5b" note="All time" />
        <Kpi label="Active" value={total - archived.length} values={m(docs.filter((d) => d.status === "active"))} color="#0e3b2c" note="In daily use" />
        <Kpi label="Archived" value={archived.length} values={m(archived)} color="#f28c28" note={`${pct}% of the archive`} />
        <Kpi label="Confidential" value={conf.length} values={m(conf)} color="#c25e00" note="Restricted access" />
      </div>
      <div className="dash">
        <Panel title="Upload trend" sub="Last 6 months" className="span2"><AreaChart data={months} /></Panel>
        <Panel title="Records by category"><Donut data={cats} center={total} label="records" /></Panel>
        <Panel title="Records by department"><Columns data={deps} /></Panel>
        <Panel title="Access levels"><Donut data={lvls} center={lvls[2].value} label="confidential" /></Panel>
        <Panel title="Archive rate"><Gauge value={pct} caption="Share of records moved to archive" /></Panel>
        <Panel title="Activity" sub="Last 14 weeks" className="span2">
          <Heatmap docs={docs} />
          <p className="scale muted">Less <i className="h0" /><i className="h1" /><i className="h2" /><i className="h3" /><i className="h4" /> More</p>
        </Panel>
        <Panel title="Top contributors"><HBars data={people} /></Panel>
        <Panel title="Recently added" className="span2">
          {recent.map((d) => (
            <button className="recent" key={d.id} onClick={() => open(d)}>
              <span>{d.title}</span>
              <small className="muted">{d.ref} &middot; {fmt(d.addedAt)}</small>
            </button>
          ))}
        </Panel>
      </div>
    </>
  );
}

function DocList({ docs, status, open }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return docs.filter((d) => d.status === status && (!cat || d.category === cat) &&
      (!s || d.title.toLowerCase().includes(s) || d.ref.toLowerCase().includes(s)))
      .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  }, [docs, status, q, cat]);
  return (
    <>
      <div className="filters">
        <input type="search" placeholder="Search title or reference" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      {list.length === 0 ? <p className="card muted center">No records found.</p> : (
        <ul className="grid">
          {list.map((d) => (
            <li key={d.id}>
              <button className="card doc" onClick={() => open(d)}>
                <span className="doc-title">{d.title}</span>
                <span className="tags">
                  <em>{d.category}</em><em>{d.department}</em>
                  <em className={d.level === "Confidential" ? "warn" : ""}>{d.level}</em>
                </span>
                <small className="muted">{d.ref}</small>
                <small className="muted">Added by: {who(d.by)} &middot; {fmt(d.addedAt)}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Upload({ onAdd }) {
  const empty = { title: "", category: CATEGORIES[0], department: DEPARTMENTS[0], level: LEVELS[1], docDate: "", description: "" };
  const [f, setF] = useState(empty);
  const [file, setFile] = useState(null);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return setErr("Enter a document title.");
    if (!file) return setErr("Choose a file to upload.");
    if (file.size > 10 * 1024 * 1024) return setErr("File is larger than 10 MB.");
    onAdd({ ...f, title: f.title.trim() }, file);
    setF(empty); setFile(null); setErr(""); e.target.reset();
  };
  return (
    <form className="card form" onSubmit={submit}>
      <label>Document title<input value={f.title} onChange={set("title")} /></label>
      <div className="cols">
        <label>Category<select value={f.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Department<select value={f.department} onChange={set("department")}>{DEPARTMENTS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Access level<select value={f.level} onChange={set("level")}>{LEVELS.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Document date<input type="date" value={f.docDate} onChange={set("docDate")} /></label>
      </div>
      <label>Description<textarea rows="3" value={f.description} onChange={set("description")} /></label>
      <label>File (PDF, Word, image, max 10 MB)
        <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files[0] || null)} />
      </label>
      {err && <p className="error" role="alert">{err}</p>}
      <button className="btn primary" type="submit">Save to archive</button>
    </form>
  );
}

function Detail({ doc, user, onClose, onStatus, onDelete }) {
  const manage = user.role !== "Staff";
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const rows = [["Reference", doc.ref], ["Category", doc.category], ["Department", doc.department], ["Access level", doc.level],
    ["Document date", doc.docDate || "Not set"], ["Added by", `${who(doc.by)} (${fmt(doc.addedAt)})`], ["Status", doc.status]];
  return (
    <div className="overlay" onClick={onClose}>
      <aside className="sheet" role="dialog" aria-modal="true" aria-label="Document details" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">&times;</button>
        <h2>{doc.title}</h2>
        <dl>{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        {doc.description && <p>{doc.description}</p>}
        <div className="actions">
          {doc.fileUrl
            ? <a className="btn primary" href={doc.fileUrl} download={doc.fileName}>Download file</a>
            : <span className="muted">No file stored for this sample record.</span>}
          {manage && <button className="btn" onClick={() => onStatus(doc)}>{doc.status === "active" ? "Move to archive" : "Restore"}</button>}
          {user.role === "Administrator" && <button className="btn danger" onClick={() => onDelete(doc)}>Delete</button>}
        </div>
      </aside>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [docs, setDocs] = useState(() => load("irsg.docs.v2", seed));
  const [logs, setLogs] = useState(() => load("irsg.logs.v2", []));
  const [view, setView] = useState("dashboard");
  const [sel, setSel] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem("irsg.docs.v2", JSON.stringify(docs.map((d) => ({ ...d, fileUrl: "" }))));
      localStorage.setItem("irsg.logs.v2", JSON.stringify(logs.slice(0, 200)));
    } catch { /* storage unavailable */ }
  }, [docs, logs]);

  if (!user) return <Login onLogin={setUser} />;

  const log = (action, doc) => setLogs((l) => [{ id: Date.now() + Math.random(), at: new Date().toISOString(), by: user.id, action, doc: doc.ref }, ...l]);
  const add = (meta, file) => {
    const n = docs.length + 1;
    const d = { ...meta, id: "d" + Date.now(), ref: `IRS/GUS/${new Date().getFullYear()}/${String(n).padStart(4, "0")}`,
      by: user.id, addedAt: new Date().toISOString(), status: "active", fileName: file.name, fileUrl: URL.createObjectURL(file) };
    setDocs([d, ...docs]); log("Uploaded", d); setView("documents");
  };
  const toggle = (d) => {
    const next = d.status === "active" ? "archived" : "active";
    setDocs(docs.map((x) => (x.id === d.id ? { ...x, status: next } : x)));
    log(next === "archived" ? "Archived" : "Restored", d); setSel(null);
  };
  const remove = (d) => {
    if (!window.confirm("Delete this record permanently?")) return;
    setDocs(docs.filter((x) => x.id !== d.id)); log("Deleted", d); setSel(null);
  };
  const nav = NAV.filter((n) => !n.admin || user.role === "Administrator");
  const current = docs.find((d) => d.id === sel?.id);
  const titles = { dashboard: "Dashboard", documents: "Documents", upload: "Upload a document", archive: "Archive", audit: "Audit log" };

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><span className="logo sm">IRS</span><span>Gusau Archive</span></div>
        <nav className="nav" aria-label="Main">
          {nav.map((n) => (
            <button key={n.id} className={view === n.id ? "on" : ""} onClick={() => setView(n.id)}>
              <Icon d={n.icon} /><span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="who">
          <b>{user.name}</b><small>{user.role}</small>
          <button className="link" onClick={() => setUser(null)}>Sign out</button>
        </div>
      </aside>
      <main className="main">
        <header className="top">
          <h1>{titles[view]}</h1>
          <button className="link mobile-only" onClick={() => setUser(null)}>Sign out</button>
        </header>
        {view === "dashboard" && <Dashboard docs={docs} open={setSel} user={user} />}
        {view === "documents" && <DocList docs={docs} status="active" open={setSel} />}
        {view === "archive" && <DocList docs={docs} status="archived" open={setSel} />}
        {view === "upload" && <Upload onAdd={add} />}
        {view === "audit" && (
          <section className="card">
            {logs.length === 0 ? <p className="muted">No activity yet.</p> : logs.map((l) => (
              <p className="log" key={l.id}><b>{l.action}</b> {l.doc}<small className="muted">{who(l.by)} &middot; {fmt(l.at)}</small></p>
            ))}
          </section>
        )}
      </main>
      {current && <Detail doc={current} user={user} onClose={() => setSel(null)} onStatus={toggle} onDelete={remove} />}
    </div>
  );
}