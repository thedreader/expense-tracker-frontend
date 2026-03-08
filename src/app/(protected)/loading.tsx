export default function ProtectedLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent-1)]" />
    </div>
  );
}
