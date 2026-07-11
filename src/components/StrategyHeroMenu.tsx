import {
  Copy,
  Footprints,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";
import type { ReactElement } from "react";
import type { StrategyPlacement } from "../types";

type TeamColor = NonNullable<StrategyPlacement["teamColor"]>;

type Props = {
  x: number;
  y: number;
  hasRoute: boolean;
  hasMotionPath: boolean;
  canEditMotionPath: boolean;
  onMovement: () => void;
  onEditMotionPath: () => void;
  onReplay: () => void;
  onRename: () => void;
  onTeamColor: (color: TeamColor) => void;
  onDuplicate: () => void;
  onClearMovement: () => void;
  onClearMotionPath: () => void;
  onClear: () => void;
  onClose: () => void;
};

export function StrategyHeroMenu({
  x,
  y,
  hasRoute,
  hasMotionPath,
  canEditMotionPath,
  onMovement,
  onEditMotionPath,
  onReplay,
  onRename,
  onTeamColor,
  onDuplicate,
  onClearMovement,
  onClearMotionPath,
  onClear,
  onClose,
}: Props) {
  const run = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      role="menu"
      aria-label="Hero options"
      className="fixed z-[90] w-56 overflow-hidden rounded-lg border border-blue-200/20 bg-[#071425]/98 p-1.5 shadow-2xl backdrop-blur-xl"
      style={{ left: x, top: y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <MenuButton icon={<Footprints />} label="Movement" onClick={() => run(onMovement)} />
      <MenuButton icon={<Footprints />} label="Edit Motion Path" disabled={!canEditMotionPath} onClick={() => run(onEditMotionPath)} />
      <MenuButton icon={<Play />} label="Replay Movement" disabled={!hasRoute} onClick={() => run(onReplay)} />
      <MenuButton icon={<Footprints />} label="Clear Movement Line" disabled={!hasRoute} onClick={() => run(onClearMovement)} />
      <MenuButton icon={<Footprints />} label="Clear Motion Path" disabled={!hasMotionPath} onClick={() => run(onClearMotionPath)} />
      <MenuButton icon={<Pencil />} label="Rename" onClick={() => run(onRename)} />
      <div className="my-1 border-t border-blue-200/10 pt-1">
        <p className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-text-muted">Team outline</p>
        <div className="grid grid-cols-3 gap-1 px-1 pb-1">
          <ColorButton label="Unassigned" color="unassigned" onClick={() => run(() => onTeamColor("unassigned"))} />
          <ColorButton label="Blue Team" color="blue" onClick={() => run(() => onTeamColor("blue"))} />
          <ColorButton label="Red Team" color="red" onClick={() => run(() => onTeamColor("red"))} />
        </div>
      </div>
      <div className="border-t border-blue-200/10 pt-1">
        <MenuButton icon={<Copy />} label="Duplicate Hero" onClick={() => run(onDuplicate)} />
        <MenuButton icon={<Trash2 />} label="Clear Hero" danger onClick={() => run(onClear)} />
      </div>
    </div>
  );
}

function MenuButton({ icon, label, onClick, disabled = false, danger = false }: { icon: ReactElement; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return <button type="button" role="menuitem" disabled={disabled} onClick={onClick} className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-35 ${danger ? "text-danger hover:bg-danger/10" : "text-white hover:bg-white/5"}`}><span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>{label}</button>;
}

function ColorButton({ label, color, onClick }: { label: string; color: TeamColor; onClick: () => void }) {
  const swatches = { unassigned: "border-gold", blue: "border-[#4ca8ff]", red: "border-[#ff5668]" };
  return <button type="button" title={label} aria-label={label} onClick={onClick} className="grid h-9 place-items-center rounded-md hover:bg-white/5"><span className={`h-4 w-4 rounded-full border-[3px] bg-background ${swatches[color]}`} /></button>;
}
