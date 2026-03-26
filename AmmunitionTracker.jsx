import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, CartesianGrid
} from "recharts";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const AMMO_TYPES = [
  { id: "HE",   label: "HE 155mm",      color: "#e85d04", icon: "💥" },
  { id: "SMK",  label: "Smoke 155mm",   color: "#6b7280", icon: "🌫️" },
  { id: "ILLUM",label: "Illum 155mm",   color: "#facc15", icon: "💡" },
  { id: "WP",   label: "WP 155mm",      color: "#a3e635", icon: "⚗️" },
  { id: "DPICM",label: "DPICM 155mm",   color: "#f97316", icon: "🎯" },
  { id: "EXCAL",label: "Excalibur",     color: "#38bdf8", icon: "🔵" },
];

const BATTERIES = [
  { id: "A", name: "Battery Alpha",   callsign: "ALPHA-6",  color: "#e85d04" },
  { id: "B", name: "Battery Bravo",   callsign: "BRAVO-6",  color: "#38bdf8" },
  { id: "C", name: "Battery Charlie", callsign: "CHARLIE-6",color: "#a3e635" },
  { id: "D", name: "Battery Delta",   callsign: "DELTA-6",  color: "#f472b6" },
];

// Initial ammo state
function initStock() {
  const s = {};
  BATTERIES.forEach(b => {
    s[b.id] = {};
    AMMO_TYPES.forEach(a => { s[b.id][a.id] = Math.floor(Math.random() * 200) + 50; });
  });
  return s;
}

const INITIAL_STOCK = initStock();

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function ts() {
  const d = new Date();
  return d.toLocaleTimeString("en-GB", { hour12: false }) + " " +
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase();
}

function statusColor(pct) {
  if (pct > 60) return "#4ade80";
  if (pct > 30) return "#facc15";
  return "#ef4444";
}

function statusLabel(pct) {
  if (pct > 60) return "GREEN";
  if (pct > 30) return "AMBER";
  return "RED";
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState(null);             // null | "BN" | "BTY"
  const [selectedBattery, setSelectedBattery] = useState("A");
  const [stock, setStock] = useState(INITIAL_STOCK);
  const [log, setLog] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [txAmmoId, setTxAmmoId] = useState("HE");
  const [txQty, setTxQty] = useState("");
  const [txNote, setTxNote] = useState("");
  const [txType, setTxType] = useState("ADD");
  const [flash, setFlash] = useState(null);

  // ── transaction submit
  function submitTx() {
    const qty = parseInt(txQty, 10);
    if (!qty || qty <= 0) return showFlash("INVALID QTY", "error");
    const bty = selectedBattery;
    const current = stock[bty][txAmmoId];
    if (txType === "SUB" && current < qty) return showFlash("INSUFFICIENT ROUNDS", "error");

    const newQty = txType === "ADD" ? current + qty : current - qty;
    setStock(prev => ({ ...prev, [bty]: { ...prev[bty], [txAmmoId]: newQty } }));
    const entry = {
      id: Date.now(),
      time: ts(),
      batteryId: bty,
      batteryName: BATTERIES.find(b => b.id === bty).name,
      ammoId: txAmmoId,
      ammoLabel: AMMO_TYPES.find(a => a.id === txAmmoId).label,
      type: txType,
      qty,
      before: current,
      after: newQty,
      note: txNote || "—",
    };
    setLog(prev => [entry, ...prev]);
    setTxQty(""); setTxNote("");
    showFlash(`${txType === "ADD" ? "+" : "-"}${qty} ROUNDS LOGGED`, "success");
  }

  function showFlash(msg, kind) {
    setFlash({ msg, kind });
    setTimeout(() => setFlash(null), 2500);
  }

  // ── totals per ammo type across all batteries
  const bnTotals = useMemo(() => {
    const t = {};
    AMMO_TYPES.forEach(a => {
      t[a.id] = BATTERIES.reduce((sum, b) => sum + stock[b.id][a.id], 0);
    });
    return t;
  }, [stock]);

  // ── max stock (for % calc) — rough constant
  const MAX_PER_BTY = 400;

  if (!role) return <RoleSelect onSelect={setRole} />;
  if (role === "BN") return (
    <BNDashboard
      stock={stock} log={log} bnTotals={bnTotals}
      maxPerBty={MAX_PER_BTY} activeTab={activeTab}
      setActiveTab={setActiveTab} onLogout={() => setRole(null)}
    />
  );
  return (
    <BtyCommander
      battery={BATTERIES.find(b => b.id === selectedBattery)}
      batteries={BATTERIES}
      selectedBattery={selectedBattery}
      setSelectedBattery={setSelectedBattery}
      stock={stock[selectedBattery]}
      log={log.filter(e => e.batteryId === selectedBattery)}
      allLog={log}
      txAmmoId={txAmmoId} setTxAmmoId={setTxAmmoId}
      txQty={txQty} setTxQty={setTxQty}
      txNote={txNote} setTxNote={setTxNote}
      txType={txType} setTxType={setTxType}
      onSubmit={submitTx} flash={flash}
      maxPerBty={MAX_PER_BTY}
      onLogout={() => setRole(null)}
    />
  );
}

// ─── ROLE SELECT ──────────────────────────────────────────────────────────────
function RoleSelect({ onSelect }) {
  return (
    <div style={s.screen}>
      <div style={s.roleWrap}>
        <div style={s.roleHeader}>
          <div style={s.roleIcon}>🎯</div>
          <div style={s.roleTitle}>ARTY AMMO TRACKER</div>
          <div style={s.roleSubtitle}>BATTALION AMMUNITION MANAGEMENT SYSTEM</div>
          <div style={s.roleDivider} />
          <div style={s.roleClassified}>SELECT AUTHENTICATION LEVEL</div>
        </div>
        <div style={s.roleCards}>
          <button style={{...s.roleCard, borderColor:"#e85d04"}} onClick={() => onSelect("BN")}>
            <div style={{...s.roleCardBadge, background:"#e85d04"}}>BN CDR</div>
            <div style={s.roleCardIcon}>🏛️</div>
            <div style={s.roleCardName}>BATTALION COMMANDER</div>
            <div style={s.roleCardDesc}>Full situational awareness dashboard — view all battery stocks, transaction history, and ammo status reports across the battalion.</div>
            <div style={{...s.roleCardEnter, color:"#e85d04"}}>ENTER COMMAND →</div>
          </button>
          <button style={{...s.roleCard, borderColor:"#38bdf8"}} onClick={() => onSelect("BTY")}>
            <div style={{...s.roleCardBadge, background:"#38bdf8", color:"#0f172a"}}>BTY CDR</div>
            <div style={s.roleCardIcon}>⚡</div>
            <div style={s.roleCardName}>BATTERY COMMANDER</div>
            <div style={s.roleCardDesc}>Manage ammunition transactions for your battery — log resupply, expenditures, and transfers with real-time updates to HQ.</div>
            <div style={{...s.roleCardEnter, color:"#38bdf8"}}>ENTER COMMAND →</div>
          </button>
        </div>
        <div style={s.roleFooter}>
          <span style={{color:"#4ade80"}}>● SYSTEM ONLINE</span>
          <span style={{color:"#6b7280", marginLeft:16}}>v2.4 // SECURE CHANNEL</span>
        </div>
      </div>
    </div>
  );
}

// ─── BN DASHBOARD ─────────────────────────────────────────────────────────────
function BNDashboard({ stock, log, bnTotals, maxPerBty, activeTab, setActiveTab, onLogout }) {
  const tabs = ["DASHBOARD", "BATTERIES", "TRANSACTIONS", "ANALYTICS"];

  // Chart data for bar chart
  const barData = AMMO_TYPES.map(a => {
    const row = { name: a.id };
    BATTERIES.forEach(b => { row[b.name.split(" ")[1]] = stock[b.id][a.id]; });
    return row;
  });

  // Timeline data (last 10 transactions aggregated)
  const lineData = log.slice(0, 20).reverse().map((e, i) => ({
    i, bty: e.batteryName.split(" ")[1], delta: e.type === "ADD" ? e.qty : -e.qty, ammo: e.ammoId
  }));

  return (
    <div style={s.screen}>
      <div style={s.bnWrap}>
        {/* HEADER */}
        <div style={s.bnHeader}>
          <div style={s.bnHeaderLeft}>
            <div style={s.bnHeaderIcon}>🏛️</div>
            <div>
              <div style={s.bnHeaderTitle}>BATTALION COMMAND</div>
              <div style={s.bnHeaderSub}>AMMUNITION STATUS BOARD // {ts()}</div>
            </div>
          </div>
          <div style={s.bnHeaderRight}>
            <div style={s.liveTag}>● LIVE</div>
            <button style={s.logoutBtn} onClick={onLogout}>LOGOUT</button>
          </div>
        </div>

        {/* TABS */}
        <div style={s.tabs}>
          {tabs.map(t => (
            <button key={t} style={{...s.tab, ...(activeTab===t.toLowerCase()?s.tabActive:{})}}
              onClick={() => setActiveTab(t.toLowerCase())}>{t}</button>
          ))}
        </div>

        <div style={s.bnBody}>

          {/* ── DASHBOARD TAB ── */}
          {activeTab === "dashboard" && (
            <div style={s.dashGrid}>
              {/* Total ammo cards */}
              {AMMO_TYPES.map(a => {
                const total = bnTotals[a.id];
                const maxTotal = maxPerBty * BATTERIES.length;
                const pct = Math.round((total / maxTotal) * 100);
                return (
                  <div key={a.id} style={{...s.ammoCard, borderColor: a.color}}>
                    <div style={s.ammoCardTop}>
                      <span style={{fontSize:22}}>{a.icon}</span>
                      <span style={{...s.statusBadge, background: statusColor(pct)+"22", color: statusColor(pct), border: `1px solid ${statusColor(pct)}`}}>
                        {statusLabel(pct)}
                      </span>
                    </div>
                    <div style={s.ammoCardLabel}>{a.label}</div>
                    <div style={{...s.ammoCardQty, color: a.color}}>{total.toLocaleString()}</div>
                    <div style={s.ammoCardUnit}>ROUNDS TOTAL</div>
                    <div style={s.progressBar}>
                      <div style={{...s.progressFill, width:`${pct}%`, background: a.color}} />
                    </div>
                    <div style={s.progressPct}>{pct}% OF CAPACITY</div>
                  </div>
                );
              })}

              {/* Battery status row */}
              <div style={{...s.fullRow, ...s.sectionCard}}>
                <div style={s.sectionTitle}>⚡ BATTERY STATUS OVERVIEW</div>
                <div style={s.btyStatusGrid}>
                  {BATTERIES.map(b => {
                    const totalRounds = AMMO_TYPES.reduce((sum, a) => sum + stock[b.id][a.id], 0);
                    const maxRounds = AMMO_TYPES.length * maxPerBty;
                    const pct = Math.round((totalRounds / maxRounds) * 100);
                    const recent = log.filter(l => l.batteryId === b.id).slice(0, 1)[0];
                    return (
                      <div key={b.id} style={{...s.btyStatusCard, borderColor: b.color}}>
                        <div style={{...s.btyCallsign, color: b.color}}>{b.callsign}</div>
                        <div style={s.btyName}>{b.name}</div>
                        <div style={{...s.btyTotal}}>{totalRounds.toLocaleString()} RDS</div>
                        <div style={s.progressBar}>
                          <div style={{...s.progressFill, width:`${pct}%`, background: b.color}} />
                        </div>
                        <div style={{...s.statusBadge, marginTop:8, background: statusColor(pct)+"22", color: statusColor(pct), border: `1px solid ${statusColor(pct)}`}}>
                          {statusLabel(pct)} // {pct}%
                        </div>
                        {recent && <div style={s.recentLog}>LAST TX: {recent.time}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick log */}
              <div style={{...s.fullRow, ...s.sectionCard}}>
                <div style={s.sectionTitle}>📋 RECENT TRANSACTIONS</div>
                <LogTable log={log.slice(0, 5)} compact />
              </div>
            </div>
          )}

          {/* ── BATTERIES TAB ── */}
          {activeTab === "batteries" && (
            <div style={s.dashGrid}>
              {BATTERIES.map(b => (
                <div key={b.id} style={{...s.btyDetailCard, borderColor: b.color}}>
                  <div style={{...s.btyDetailHeader, borderBottomColor: b.color}}>
                    <span style={{...s.btyCallsign, color: b.color, fontSize:18}}>{b.callsign}</span>
                    <span style={s.btyName}>{b.name}</span>
                  </div>
                  {AMMO_TYPES.map(a => {
                    const qty = stock[b.id][a.id];
                    const pct = Math.round((qty / maxPerBty) * 100);
                    return (
                      <div key={a.id} style={s.ammoRow}>
                        <span style={s.ammoRowIcon}>{a.icon}</span>
                        <span style={s.ammoRowLabel}>{a.id}</span>
                        <div style={{...s.inlineBar}}>
                          <div style={{...s.inlineFill, width:`${Math.min(pct,100)}%`, background: a.color}} />
                        </div>
                        <span style={{...s.ammoRowQty, color: statusColor(pct)}}>{qty}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ── TRANSACTIONS TAB ── */}
          {activeTab === "transactions" && (
            <div style={s.sectionCard}>
              <div style={s.sectionTitle}>📋 FULL TRANSACTION LOG — {log.length} ENTRIES</div>
              {log.length === 0
                ? <div style={s.emptyState}>NO TRANSACTIONS LOGGED YET</div>
                : <LogTable log={log} />}
            </div>
          )}

          {/* ── ANALYTICS TAB ── */}
          {activeTab === "analytics" && (
            <div style={s.dashGrid}>
              <div style={{...s.fullRow, ...s.sectionCard}}>
                <div style={s.sectionTitle}>📊 AMMO DISTRIBUTION BY BATTERY</div>
                <div style={{height:280, marginTop:16}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{top:0,right:10,bottom:0,left:-10}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" tick={{fill:"#94a3b8",fontSize:11,fontFamily:"monospace"}} />
                      <YAxis tick={{fill:"#94a3b8",fontSize:11,fontFamily:"monospace"}} />
                      <Tooltip contentStyle={{background:"#0f172a",border:"1px solid #334155",color:"#e2e8f0",fontFamily:"monospace",fontSize:12}} />
                      <Legend wrapperStyle={{fontFamily:"monospace",fontSize:11,color:"#94a3b8"}} />
                      {BATTERIES.map(b => (
                        <Bar key={b.id} dataKey={b.name.split(" ")[1]} fill={b.color} radius={[2,2,0,0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {log.length > 0 && (
                <div style={{...s.fullRow, ...s.sectionCard}}>
                  <div style={s.sectionTitle}>📈 TRANSACTION DELTA (LAST {Math.min(log.length,20)} EVENTS)</div>
                  <div style={{height:220, marginTop:16}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineData} margin={{top:0,right:10,bottom:0,left:-20}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="i" tick={{fill:"#94a3b8",fontSize:10}} />
                        <YAxis tick={{fill:"#94a3b8",fontSize:10,fontFamily:"monospace"}} />
                        <Tooltip contentStyle={{background:"#0f172a",border:"1px solid #334155",color:"#e2e8f0",fontFamily:"monospace",fontSize:12}} />
                        <Line type="monotone" dataKey="delta" stroke="#e85d04" dot={{fill:"#e85d04",r:3}} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Ammo breakdown totals */}
              <div style={{...s.fullRow, ...s.sectionCard}}>
                <div style={s.sectionTitle}>🎯 BATTALION AMMO TOTALS</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:12,marginTop:14}}>
                  {AMMO_TYPES.map(a => {
                    const total = bnTotals[a.id];
                    const maxTotal = maxPerBty * BATTERIES.length;
                    const pct = Math.round((total / maxTotal) * 100);
                    return (
                      <div key={a.id} style={{flex:"1 1 160px", background:"#0f172a", border:`1px solid ${a.color}33`, borderRadius:8, padding:"12px 16px"}}>
                        <div style={{color: a.color, fontSize:12, fontFamily:"monospace", fontWeight:700}}>{a.icon} {a.id}</div>
                        <div style={{color:"#f1f5f9", fontSize:24, fontFamily:"'Courier New',monospace", fontWeight:900, marginTop:4}}>{total.toLocaleString()}</div>
                        <div style={{color:"#64748b", fontSize:11, fontFamily:"monospace"}}>/ {maxTotal.toLocaleString()} MAX</div>
                        <div style={s.progressBar}>
                          <div style={{...s.progressFill, width:`${pct}%`, background: a.color}} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BATTERY COMMANDER ────────────────────────────────────────────────────────
function BtyCommander({ battery, batteries, selectedBattery, setSelectedBattery,
  stock, log, txAmmoId, setTxAmmoId, txQty, setTxQty, txNote, setTxNote,
  txType, setTxType, onSubmit, flash, maxPerBty, onLogout }) {

  return (
    <div style={s.screen}>
      <div style={s.btyWrap}>
        {/* HEADER */}
        <div style={{...s.bnHeader, borderBottomColor: battery.color}}>
          <div style={s.bnHeaderLeft}>
            <div style={{...s.bnHeaderIcon, color: battery.color}}>⚡</div>
            <div>
              <div style={{...s.bnHeaderTitle, color: battery.color}}>{battery.callsign}</div>
              <div style={s.bnHeaderSub}>{battery.name.toUpperCase()} // AMMO MANAGEMENT</div>
            </div>
          </div>
          <div style={s.bnHeaderRight}>
            <select style={s.batterySelect} value={selectedBattery}
              onChange={e => setSelectedBattery(e.target.value)}>
              {batteries.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <button style={s.logoutBtn} onClick={onLogout}>LOGOUT</button>
          </div>
        </div>

        {/* FLASH */}
        {flash && (
          <div style={{...s.flash, background: flash.kind==="success"?"#052e16":"#450a0a", borderColor: flash.kind==="success"?"#4ade80":"#f87171", color: flash.kind==="success"?"#4ade80":"#f87171"}}>
            {flash.kind === "success" ? "✓ " : "✗ "}{flash.msg}
          </div>
        )}

        <div style={s.btyBody}>
          {/* CURRENT STOCK */}
          <div style={s.btyLeft}>
            <div style={{...s.sectionCard, marginBottom:16}}>
              <div style={s.sectionTitle}>📦 CURRENT STOCK — {battery.name.toUpperCase()}</div>
              <div style={{marginTop:12}}>
                {AMMO_TYPES.map(a => {
                  const qty = stock[a.id];
                  const pct = Math.min(Math.round((qty / maxPerBty) * 100), 100);
                  return (
                    <div key={a.id} style={s.stockRow}>
                      <div style={s.stockRowTop}>
                        <span style={s.stockIcon}>{a.icon}</span>
                        <span style={s.stockLabel}>{a.label}</span>
                        <span style={{...s.stockQty, color: statusColor(pct)}}>{qty}</span>
                      </div>
                      <div style={s.progressBar}>
                        <div style={{...s.progressFill, width:`${pct}%`, background: a.color, transition:"width 0.4s ease"}} />
                      </div>
                      <div style={s.stockMeta}>
                        <span style={{color:"#475569"}}>{pct}% // {statusLabel(pct)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RECENT LOG */}
            <div style={s.sectionCard}>
              <div style={s.sectionTitle}>📋 BATTERY LOG ({log.length})</div>
              {log.length === 0
                ? <div style={s.emptyState}>NO TRANSACTIONS YET</div>
                : <LogTable log={log.slice(0, 8)} compact />}
            </div>
          </div>

          {/* TRANSACTION PANEL */}
          <div style={s.btyRight}>
            <div style={{...s.sectionCard, border:`1px solid ${battery.color}55`}}>
              <div style={{...s.sectionTitle, color: battery.color}}>⚙️ LOG TRANSACTION</div>

              {/* Type toggle */}
              <div style={s.txToggle}>
                <button style={{...s.txToggleBtn, ...(txType==="ADD"?{background:"#052e16",color:"#4ade80",border:"1px solid #4ade80"}:{})}}
                  onClick={() => setTxType("ADD")}>+ RESUPPLY / ADD</button>
                <button style={{...s.txToggleBtn, ...(txType==="SUB"?{background:"#450a0a",color:"#f87171",border:"1px solid #f87171"}:{})}}
                  onClick={() => setTxType("SUB")}>− EXPEND / SUBTRACT</button>
              </div>

              {/* Ammo selector */}
              <div style={s.txField}>
                <label style={s.txLabel}>AMMUNITION TYPE</label>
                <div style={s.ammoSelector}>
                  {AMMO_TYPES.map(a => (
                    <button key={a.id} style={{...s.ammoSelectorBtn, ...(txAmmoId===a.id?{background: a.color+"22", border:`1px solid ${a.color}`, color: a.color}:{})}}
                      onClick={() => setTxAmmoId(a.id)}>
                      <span>{a.icon}</span>
                      <span style={{fontSize:10, fontFamily:"monospace"}}>{a.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div style={s.txField}>
                <label style={s.txLabel}>QUANTITY (ROUNDS)</label>
                <input style={s.txInput} type="number" min="1" placeholder="0"
                  value={txQty} onChange={e => setTxQty(e.target.value)} />
              </div>

              {/* Note */}
              <div style={s.txField}>
                <label style={s.txLabel}>NOTES / REASON</label>
                <input style={s.txInput} type="text" placeholder="e.g. RESUPPLY FROM BN LOG, FIRE MISSION ALPHA..."
                  value={txNote} onChange={e => setTxNote(e.target.value)} />
              </div>

              {/* Preview */}
              {txQty && parseInt(txQty) > 0 && (
                <div style={s.txPreview}>
                  <div style={{color:"#94a3b8", fontSize:11, fontFamily:"monospace", marginBottom:4}}>TRANSACTION PREVIEW</div>
                  <div style={{color:"#e2e8f0", fontFamily:"monospace", fontSize:13}}>
                    {txType === "ADD" ? "+" : "-"}{txQty} × {AMMO_TYPES.find(a=>a.id===txAmmoId)?.label}
                  </div>
                  <div style={{color:"#64748b", fontSize:11, fontFamily:"monospace", marginTop:2}}>
                    {stock[txAmmoId]} → {txType==="ADD" ? stock[txAmmoId] + parseInt(txQty||0) : stock[txAmmoId] - parseInt(txQty||0)} RDS
                  </div>
                </div>
              )}

              <button style={{...s.txSubmit, background: txType==="ADD"?"#052e16":"#450a0a",
                border: `1px solid ${txType==="ADD"?"#4ade80":"#f87171"}`,
                color: txType==="ADD"?"#4ade80":"#f87171"}}
                onClick={onSubmit}>
                {txType === "ADD" ? "▲ CONFIRM RESUPPLY" : "▼ CONFIRM EXPENDITURE"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LOG TABLE ────────────────────────────────────────────────────────────────
function LogTable({ log, compact }) {
  return (
    <div style={{overflowX:"auto"}}>
      <table style={s.logTable}>
        <thead>
          <tr>
            <th style={s.th}>TIME</th>
            {!compact && <th style={s.th}>BATTERY</th>}
            <th style={s.th}>AMMO</th>
            <th style={s.th}>TYPE</th>
            <th style={s.th}>QTY</th>
            <th style={s.th}>BEFORE</th>
            <th style={s.th}>AFTER</th>
            {!compact && <th style={s.th}>NOTE</th>}
          </tr>
        </thead>
        <tbody>
          {log.map(e => (
            <tr key={e.id} style={s.tr}>
              <td style={{...s.td, color:"#64748b", fontSize:10, whiteSpace:"nowrap"}}>{e.time}</td>
              {!compact && <td style={{...s.td, color:"#94a3b8"}}>{e.batteryName.replace("Battery ","")}</td>}
              <td style={{...s.td, color:"#e2e8f0"}}>{e.ammoId}</td>
              <td style={{...s.td}}>
                <span style={{color: e.type==="ADD"?"#4ade80":"#f87171", fontWeight:700}}>
                  {e.type==="ADD"?"▲ ADD":"▼ SUB"}
                </span>
              </td>
              <td style={{...s.td, color: e.type==="ADD"?"#4ade80":"#f87171", fontWeight:700}}>
                {e.type==="ADD"?"+":"-"}{e.qty}
              </td>
              <td style={{...s.td, color:"#64748b"}}>{e.before}</td>
              <td style={{...s.td, color:"#e2e8f0", fontWeight:600}}>{e.after}</td>
              {!compact && <td style={{...s.td, color:"#64748b", maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{e.note}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = {
  screen: {
    minHeight:"100vh", background:"#020817",
    fontFamily:"'Courier New', Courier, monospace",
    color:"#e2e8f0", display:"flex", justifyContent:"center",
    alignItems:"flex-start",
    backgroundImage:"radial-gradient(ellipse at 20% 50%, #0f172a 0%, #020817 60%)",
  },

  // ROLE SELECT
  roleWrap: { width:"100%", maxWidth:680, padding:"48px 20px", display:"flex", flexDirection:"column", alignItems:"center" },
  roleHeader: { textAlign:"center", marginBottom:40 },
  roleIcon: { fontSize:48, marginBottom:16 },
  roleTitle: { fontSize:28, fontWeight:900, letterSpacing:6, color:"#f1f5f9", fontFamily:"'Courier New',monospace" },
  roleSubtitle: { fontSize:11, color:"#475569", letterSpacing:3, marginTop:4 },
  roleDivider: { height:1, background:"linear-gradient(90deg, transparent, #e85d04, transparent)", margin:"20px auto", width:200 },
  roleClassified: { fontSize:11, color:"#e85d04", letterSpacing:4, fontWeight:700 },
  roleCards: { display:"flex", flexDirection:"column", gap:16, width:"100%" },
  roleCard: { background:"#0f172a", border:"1px solid", borderRadius:12, padding:"24px 28px", textAlign:"left", cursor:"pointer", transition:"all 0.2s", color:"inherit" },
  roleCardBadge: { display:"inline-block", padding:"2px 10px", borderRadius:4, fontSize:10, fontWeight:900, letterSpacing:2, marginBottom:12, color:"#fff" },
  roleCardIcon: { fontSize:32, marginBottom:8 },
  roleCardName: { fontSize:16, fontWeight:900, letterSpacing:3, color:"#f1f5f9", marginBottom:8 },
  roleCardDesc: { fontSize:12, color:"#64748b", lineHeight:1.6, marginBottom:12 },
  roleCardEnter: { fontSize:11, fontWeight:700, letterSpacing:2 },
  roleFooter: { marginTop:36, fontSize:11, letterSpacing:2, display:"flex", gap:8 },

  // BN DASHBOARD
  bnWrap: { width:"100%", maxWidth:1280, padding:"0 0 40px" },
  bnHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 24px", borderBottom:"1px solid #1e293b", background:"#020817", position:"sticky", top:0, zIndex:10 },
  bnHeaderLeft: { display:"flex", alignItems:"center", gap:12 },
  bnHeaderIcon: { fontSize:28 },
  bnHeaderTitle: { fontSize:18, fontWeight:900, letterSpacing:3, color:"#f1f5f9" },
  bnHeaderSub: { fontSize:10, color:"#475569", letterSpacing:2, marginTop:1 },
  bnHeaderRight: { display:"flex", alignItems:"center", gap:12 },
  liveTag: { color:"#4ade80", fontSize:11, letterSpacing:2, animation:"pulse 2s infinite" },
  logoutBtn: { background:"transparent", border:"1px solid #334155", color:"#64748b", padding:"6px 14px", borderRadius:6, cursor:"pointer", fontSize:11, letterSpacing:1, fontFamily:"'Courier New',monospace" },

  tabs: { display:"flex", borderBottom:"1px solid #1e293b", padding:"0 24px", background:"#020817", gap:0 },
  tab: { background:"transparent", border:"none", color:"#475569", padding:"12px 20px", cursor:"pointer", fontSize:11, letterSpacing:2, fontFamily:"'Courier New',monospace", borderBottom:"2px solid transparent", transition:"all 0.2s" },
  tabActive: { color:"#e85d04", borderBottomColor:"#e85d04" },

  bnBody: { padding:"24px" },
  dashGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:16 },
  fullRow: { gridColumn:"1 / -1" },

  ammoCard: { background:"#0f172a", border:"1px solid", borderRadius:10, padding:"16px" },
  ammoCardTop: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 },
  ammoCardLabel: { fontSize:10, color:"#64748b", letterSpacing:1, marginBottom:4 },
  ammoCardQty: { fontSize:28, fontWeight:900, letterSpacing:1 },
  ammoCardUnit: { fontSize:9, color:"#475569", letterSpacing:2, marginBottom:8 },

  statusBadge: { fontSize:9, fontWeight:700, letterSpacing:2, padding:"2px 8px", borderRadius:4, display:"inline-block" },

  progressBar: { height:4, background:"#1e293b", borderRadius:2, overflow:"hidden", margin:"6px 0" },
  progressFill: { height:"100%", borderRadius:2 },
  progressPct: { fontSize:9, color:"#475569", letterSpacing:1 },

  sectionCard: { background:"#0f172a", border:"1px solid #1e293b", borderRadius:10, padding:"16px 20px" },
  sectionTitle: { fontSize:11, color:"#94a3b8", letterSpacing:3, fontWeight:700, marginBottom:4 },

  btyStatusGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:12, marginTop:14 },
  btyStatusCard: { background:"#020817", border:"1px solid", borderRadius:8, padding:"14px" },
  btyCallsign: { fontSize:13, fontWeight:900, letterSpacing:2, display:"block" },
  btyName: { fontSize:10, color:"#64748b", letterSpacing:1, marginTop:2, display:"block" },
  btyTotal: { fontSize:20, fontWeight:900, color:"#f1f5f9", marginTop:8, marginBottom:4, display:"block" },
  recentLog: { fontSize:9, color:"#334155", letterSpacing:1, marginTop:6 },

  btyDetailCard: { background:"#0f172a", border:"1px solid", borderRadius:10, padding:0, overflow:"hidden" },
  btyDetailHeader: { display:"flex", alignItems:"center", gap:10, padding:"12px 16px", borderBottom:"1px solid" },

  ammoRow: { display:"flex", alignItems:"center", gap:8, padding:"8px 16px", borderBottom:"1px solid #0f172a" },
  ammoRowIcon: { fontSize:14, width:20 },
  ammoRowLabel: { fontSize:10, color:"#64748b", letterSpacing:1, width:50 },
  inlineBar: { flex:1, height:6, background:"#1e293b", borderRadius:3, overflow:"hidden" },
  inlineFill: { height:"100%", borderRadius:3, transition:"width 0.4s" },
  ammoRowQty: { fontSize:12, fontWeight:700, fontFamily:"monospace", width:45, textAlign:"right" },

  emptyState: { color:"#334155", fontSize:11, letterSpacing:2, textAlign:"center", padding:"24px 0" },

  // BATTERY COMMANDER
  btyWrap: { width:"100%", maxWidth:1100 },
  btyBody: { display:"grid", gridTemplateColumns:"1fr 360px", gap:20, padding:"20px 24px", "@media(max-width:768px)":{gridTemplateColumns:"1fr"} },
  btyLeft: { minWidth:0 },
  btyRight: { minWidth:0 },

  batterySelect: { background:"#0f172a", border:"1px solid #334155", color:"#94a3b8", padding:"6px 10px", borderRadius:6, fontSize:11, fontFamily:"'Courier New',monospace", cursor:"pointer" },

  flash: { margin:"0 24px", padding:"10px 16px", borderRadius:8, border:"1px solid", fontSize:12, letterSpacing:2, fontWeight:700, textAlign:"center", transition:"all 0.3s" },

  stockRow: { marginBottom:14 },
  stockRowTop: { display:"flex", alignItems:"center", gap:8, marginBottom:4 },
  stockIcon: { fontSize:16, width:24 },
  stockLabel: { fontSize:11, color:"#94a3b8", letterSpacing:1, flex:1 },
  stockQty: { fontSize:16, fontWeight:900, fontFamily:"monospace", width:50, textAlign:"right" },
  stockMeta: { fontSize:9, color:"#475569", letterSpacing:1, paddingLeft:32 },

  txToggle: { display:"flex", gap:8, marginTop:14, marginBottom:16 },
  txToggleBtn: { flex:1, background:"#0f172a", border:"1px solid #334155", color:"#475569", padding:"8px", borderRadius:6, cursor:"pointer", fontSize:10, letterSpacing:1, fontFamily:"'Courier New',monospace", transition:"all 0.2s" },

  txField: { marginBottom:14 },
  txLabel: { fontSize:9, color:"#475569", letterSpacing:2, display:"block", marginBottom:6 },
  txInput: { width:"100%", background:"#020817", border:"1px solid #334155", color:"#e2e8f0", padding:"10px 12px", borderRadius:6, fontSize:13, fontFamily:"'Courier New',monospace", boxSizing:"border-box", outline:"none" },

  ammoSelector: { display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8 },
  ammoSelectorBtn: { background:"#020817", border:"1px solid #334155", color:"#475569", padding:"10px 6px", borderRadius:6, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4, transition:"all 0.2s", fontSize:16, fontFamily:"'Courier New',monospace" },

  txPreview: { background:"#020817", border:"1px solid #334155", borderRadius:6, padding:"12px", marginBottom:14 },

  txSubmit: { width:"100%", padding:"12px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:900, letterSpacing:3, fontFamily:"'Courier New',monospace", transition:"all 0.2s", marginTop:4 },

  // LOG TABLE
  logTable: { width:"100%", borderCollapse:"collapse", fontSize:11, marginTop:12 },
  th: { color:"#475569", fontFamily:"monospace", letterSpacing:2, fontSize:9, padding:"6px 8px", textAlign:"left", borderBottom:"1px solid #1e293b", whiteSpace:"nowrap" },
  td: { padding:"6px 8px", borderBottom:"1px solid #0f172a", fontFamily:"monospace", fontSize:11 },
  tr: { transition:"background 0.1s" },
};
