import { useId } from "react";

export const PALETTE = ["#1f8a5b", "#f28c28", "#0e3b2c", "#f6b36a", "#6fbf94", "#c25e00", "#9ad1b3"];

export function monthSeries(docs, n = 6) {
  const now = new Date(2026, 9, 1);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = docs.filter((x) => {
      const a = new Date(x.addedAt);
      return a.getFullYear() === d.getFullYear() && a.getMonth() === d.getMonth();
    }).length;
    out.push({ label: d.toLocaleString("en-GB", { month: "short" }), value });
  }
  return out;
}

export function Sparkline({ values, color = "#1f8a5b" }) {
  const id = useId();
  const max = Math.max(1, ...values);
  const w = 120, h = 36;
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * w, h - 4 - (v / max) * (h - 8)]);
  const line = pts.map((p) => p.join(",")).join(" ");
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${line} ${w},${h}`} fill={`url(#${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function AreaChart({ data }) {
  const id = useId();
  const W = 600, H = 240, L = 34, R = 16, T = 20, B = 30;
  const max = Math.max(4, ...data.map((d) => d.value));
  const top = Math.ceil(max / 4) * 4;
  const x = (i) => L + (i / Math.max(1, data.length - 1)) * (W - L - R);
  const y = (v) => T + (1 - v / top) * (H - T - B);
  let path = `M ${x(0)} ${y(data[0].value)}`;
  for (let i = 1; i < data.length; i++) {
    const mx = (x(i - 1) + x(i)) / 2;
    path += ` C ${mx} ${y(data[i - 1].value)} ${mx} ${y(data[i].value)} ${x(i)} ${y(data[i].value)}`;
  }
  const area = `${path} L ${x(data.length - 1)} ${H - B} L ${x(0)} ${H - B} Z`;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Uploads per month">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f8a5b" stopOpacity="0.45" />
          <stop offset="1" stopColor="#1f8a5b" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map((i) => {
        const v = (top / 4) * i;
        return (
          <g key={i}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#dcebe2" strokeDasharray="4 4" />
            <text x={L - 8} y={y(v) + 4} textAnchor="end" className="axis">{v}</text>
          </g>
        );
      })}
      <path d={area} fill={`url(#${id})`} />
      <path d={path} fill="none" stroke="#1f8a5b" strokeWidth="3.5" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={d.label}>
          <circle cx={x(i)} cy={y(d.value)} r="6" fill="#fff" stroke="#f28c28" strokeWidth="3.5" />
          <text x={x(i)} y={y(d.value) - 12} textAnchor="middle" className="val">{d.value}</text>
          <text x={x(i)} y={H - 8} textAnchor="middle" className="axis">{d.label}</text>
        </g>
      ))}
    </svg>
  );
}

export function Donut({ data, center, label }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  return (
    <div className="donut">
      <svg viewBox="0 0 42 42" role="img" aria-label={label}>
        <circle cx="21" cy="21" r="15.9155" fill="none" stroke="#eaf3ee" strokeWidth="6" />
        {data.map((d) => {
          const pct = (d.value / total) * 100;
          const el = (
            <circle key={d.label} cx="21" cy="21" r="15.9155" fill="none" stroke={d.color} strokeWidth="6"
              strokeDasharray={`${Math.max(0, pct - 0.6)} ${100 - Math.max(0, pct - 0.6)}`}
              strokeDashoffset={25 - acc} />
          );
          acc += pct;
          return el;
        })}
        <text x="21" y="22.5" textAnchor="middle" className="donut-num">{center}</text>
        <text x="21" y="27.5" textAnchor="middle" className="donut-sub">{label}</text>
      </svg>
      <ul className="legend">
        {data.map((d) => (
          <li key={d.label}><i style={{ background: d.color }} />{d.label}<b>{d.value}</b></li>
        ))}
      </ul>
    </div>
  );
}

export function HBars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="hbars">
      {data.map((d, i) => (
        <div className="hb" key={d.label}>
          <span>{d.label}</span>
          <div><i style={{ width: `${(d.value / max) * 100}%`, background: i % 2 ? "linear-gradient(90deg,#f6b36a,#f28c28)" : "linear-gradient(90deg,#6fbf94,#1f8a5b)" }} /></div>
          <b>{d.value}</b>
        </div>
      ))}
    </div>
  );
}

export function Columns({ data }) {
  const W = 360, H = 200, B = 34, T = 18;
  const max = Math.max(1, ...data.map((d) => d.value));
  const bw = W / data.length;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Records by department">
      <defs>
        <linearGradient id="colg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f28c28" /><stop offset="1" stopColor="#f6b36a" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const h = (d.value / max) * (H - B - T);
        return (
          <g key={d.label}>
            <rect x={i * bw + bw * 0.2} y={H - B - h} width={bw * 0.6} height={h} rx="7" fill={i % 2 ? "url(#colg)" : "#1f8a5b"} />
            <text x={i * bw + bw / 2} y={H - B - h - 6} textAnchor="middle" className="val">{d.value}</text>
            <text x={i * bw + bw / 2} y={H - 12} textAnchor="middle" className="axis">{d.label.slice(0, 9)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Gauge({ value, caption }) {
  return (
    <div className="gauge">
      <svg viewBox="0 0 100 62" role="img" aria-label={caption}>
        <path d="M 10 54 A 40 40 0 0 1 90 54" pathLength="100" fill="none" stroke="#eaf3ee" strokeWidth="10" strokeLinecap="round" />
        <path d="M 10 54 A 40 40 0 0 1 90 54" pathLength="100" fill="none" stroke="#f28c28" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${value} 100`} />
        <text x="50" y="50" textAnchor="middle" className="gauge-num">{value}%</text>
      </svg>
      <p className="muted center">{caption}</p>
    </div>
  );
}

export function Heatmap({ docs, weeks = 14 }) {
  const end = new Date(2026, 9, 20);
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(end.getDate() - (weeks * 7 - 1) - ((end.getDay() + 6) % 7) + ((end.getDay() + 6) % 7));
  const counts = {};
  docs.forEach((d) => { const k = new Date(d.addedAt).toDateString(); counts[k] = (counts[k] || 0) + 1; });
  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const n = counts[day.toDateString()] || 0;
    cells.push(<i key={i} className={`h${Math.min(4, n)}`} title={`${day.toDateString()}: ${n}`} />);
  }
  return <div className="heat" style={{ gridTemplateRows: "repeat(7, 1fr)" }}>{cells}</div>;
}