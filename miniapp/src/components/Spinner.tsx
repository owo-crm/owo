type SpinnerProps = {
  label?: string;
};

export function Spinner({ label = "Loading..." }: SpinnerProps) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="spinner" />
      <span className="loading-state__label">{label}</span>
    </div>
  );
}
