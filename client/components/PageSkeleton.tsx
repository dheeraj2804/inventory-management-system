export default function PageSkeleton() {
  return (
    <div className="page-skeleton" role="status" aria-label="Loading workspace">
      <div className="skeleton" style={{ height: 18, width: 130 }} />
      <div
        className="skeleton"
        style={{ height: 34, width: 240, marginTop: 16 }}
      />
      <div className="metric-grid" style={{ marginTop: 30 }}>
        {[1, 2, 3, 4].map((i) => (
          <div className="skeleton" key={i} style={{ height: 135 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 300, marginTop: 24 }} />
      <span className="sr-only">Loading workspace…</span>
    </div>
  );
}
