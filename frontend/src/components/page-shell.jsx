function PageShell({ eyebrow, title, description, actions, stats, children }) {
  return (
    <section className="flex-1">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {eyebrow ? (
            <p className="hidden text-sm font-medium uppercase tracking-[0.2em] text-slate-400 lg:block">{eyebrow}</p>
          ) : null}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>

        <div className="flex flex-col gap-3">
          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
          {stats ? <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">{stats}</div> : null}
        </div>
      </div>

      {children}
    </section>
  );
}

export { PageShell };
