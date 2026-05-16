import { Link } from "react-router-dom";
import { PauseCircle } from "lucide-react";
import { Button, Card } from "../components/ui";

export default function PausedFeature({ featureName }: { featureName: string }) {
  return (
    <div className="grid min-h-[58vh] place-items-center text-left">
      <Card className="max-w-xl p-8 text-center">
        <PauseCircle className="mx-auto mb-6 h-14 w-14 text-gold" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">
          Feature paused for MVP
        </p>
        <h1 className="mt-3 font-display text-3xl font-black uppercase text-white">
          {featureName}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm font-semibold leading-6 text-text-muted">
          This section has been intentionally removed from the first squad build.
          It can return later once the core app is stable and connected to Supabase.
        </p>
        <Link to="/">
          <Button variant="gold" className="mt-8">
            Back to Dashboard
          </Button>
        </Link>
      </Card>
    </div>
  );
}
