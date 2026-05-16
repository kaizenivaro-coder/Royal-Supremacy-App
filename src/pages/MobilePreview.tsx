export default function MobilePreview() {
  return (
    <div className="min-h-screen bg-background text-text-white">
      <main className="grid min-h-screen place-items-center px-4 py-6">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-gold">
              Royal Supremacy
            </p>
            <h1 className="mt-2 font-display text-2xl font-black uppercase text-white mlbb-title">
              Phone Preview
            </h1>
          </div>
          <div className="h-[844px] w-[390px] max-h-[calc(100vh-120px)] max-w-[calc(100vw-24px)] overflow-hidden rounded-[38px] border-[10px] border-[#0b1324] bg-background shadow-[0_28px_90px_rgba(0,0,0,0.55),0_0_0_1px_rgba(242,196,83,0.28)]">
            <iframe
              src="/"
              title="Royal Supremacy phone preview"
              className="h-full w-full border-0"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
