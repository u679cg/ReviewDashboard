export function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
