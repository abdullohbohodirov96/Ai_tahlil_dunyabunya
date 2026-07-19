export default function StatCard({ label, value, sub, accentColor = "text-accent" }) {
  return (
    <div className="bg-panel border border-border rounded-xl px-5 py-4 flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-textMuted">{label}</span>
      <span className={`font-mono text-2xl font-medium mono-num ${accentColor}`}>{value}</span>
      {sub && <span className="text-xs text-textMuted">{sub}</span>}
    </div>
  );
}
