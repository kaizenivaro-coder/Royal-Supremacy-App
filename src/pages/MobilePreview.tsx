export default function MobilePreview() {
  const appRoot = import.meta.env.BASE_URL || "/";

  return (
    <div className="min-h-screen bg-background text-text-white">
      <main className="grid min-h-screen place-items-center px-4 py-6">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-gold">
              Design and Development QA
            </p>
            <h1 className="mt-2 font-display text-2xl font-black uppercase text-white mlbb-title">
              Responsive Preview
            </h1>
            <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-text-muted">
              Check responsive navigation and key flows in a fixed mobile viewport.
            </p>
            <a
              href={appRoot}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-gold/35 bg-gold px-4 text-xs font-black uppercase tracking-widest text-background transition hover:bg-white"
            >
              Open Full View
            </a>
          </div>
          <div className="h-[844px] w-[390px] max-h-[calc(100vh-190px)] max-w-[calc(100vw-24px)] overflow-hidden rounded-[38px] border-[10px] border-[#0b1324] bg-background shadow-[0_28px_90px_rgba(0,0,0,0.55),0_0_0_1px_rgba(242,196,83,0.28)]">
            <iframe
              src={appRoot}
              title="Royal Supremacy responsive preview"
              className="h-full w-full border-0"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
