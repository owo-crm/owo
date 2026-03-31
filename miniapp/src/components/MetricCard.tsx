type MetricCardProps = {
  label: string;
  value: string;
  trend: string;
};

export function MetricCard({ label, value, trend }: MetricCardProps) {
  return (
    <article className="metric-card">
      <span className="metric-card__label">{label}</span>
      <strong className="metric-card__value">{value}</strong>
      <span className="metric-card__trend">{trend}</span>
    </article>
  );
}
