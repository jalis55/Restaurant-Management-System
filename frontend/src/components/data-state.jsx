function DataState({ isLoading, error, empty, children, loadingLabel = "Loading data..." }) {
  if (isLoading) {
    return (
      <div className="rounded-[28px] border border-black/6 bg-white p-8 text-sm text-slate-500 shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
        {loadingLabel}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
        {error}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="rounded-[28px] border border-black/6 bg-white p-8 text-sm text-slate-500 shadow-[0_10px_40px_rgba(15,23,42,0.05)]">
        Nothing to show yet.
      </div>
    );
  }

  return children;
}

export { DataState };
