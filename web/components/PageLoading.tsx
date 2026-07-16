export function PageLoading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 60 }}>
      <span className="typing-dots muted" aria-hidden="true" style={{ transform: "scale(1.6)" }}>
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}
