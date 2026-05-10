import React from "react";

type Loader4Props = {
  className?: string;
  cellSize?: "sm" | "md";
  tone?: "danger" | "warn" | "ready" | "done";
};

const toneClassMap: Record<NonNullable<Loader4Props["tone"]>, string> = {
  danger: "loader-4--danger",
  warn: "loader-4--warn",
  ready: "loader-4--ready",
  done: "loader-4--done",
};

export default function Loader4({
  className = "",
  cellSize = "sm",
  tone,
}: Loader4Props) {
  const toneClass = tone ? toneClassMap[tone] : "";
  return (
    <div
      className={`loader-4 ${cellSize === "sm" ? "loader-4--sm" : ""} ${toneClass} ${className}`.trim()}
      aria-label="Loading"
      role="status"
    >
      <div className="loader-4__cell loader-4__cell--d0" />
      <div className="loader-4__cell loader-4__cell--d1" />
      <div className="loader-4__cell loader-4__cell--d2" />
      <div className="loader-4__cell loader-4__cell--d1" />
      <div className="loader-4__cell loader-4__cell--d2" />
      <div className="loader-4__cell loader-4__cell--d2" />
      <div className="loader-4__cell loader-4__cell--d3" />
      <div className="loader-4__cell loader-4__cell--d3" />
      <div className="loader-4__cell loader-4__cell--d4" />
    </div>
  );
}
