import { useAppStore } from "../data/store";
import { Card, PageHeader, Badge } from "../components/ui";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Users, Coins } from "lucide-react";

export default function Points() {
  const { points, members } = useAppStore();

  const getMemberName = (id: string) => {
    const member = members.find((m) => m.id === id);
    return member ? member.playerName : "Unknown";
  };

  const sortedPoints = [...points].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const totalAwarded = points.filter(p => p.change > 0).reduce((acc, curr) => acc + curr.change, 0);
  const totalDeducted = points.filter(p => p.change < 0).reduce((acc, curr) => acc + Math.abs(curr.change), 0);
  const topEarner = [...members].sort((a,b) => b.royalPoints - a.royalPoints)[0];

  return (
    <div className="space-y-8 pb-10 text-left">
      <PageHeader
        title="Royal Credit Registry"
        description="Official log of merit and disciplinary credit adjustments."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="flex items-center gap-4 p-6 bg-success/5 border-success/10 group">
          <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success shrink-0 group-hover:bg-success/20 transition-colors">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-black text-text-muted mb-0.5">Total Merits</p>
            <h3 className="text-2xl font-black text-success leading-none">+{totalAwarded}</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-6 bg-danger/5 border-danger/10 group">
          <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center text-danger shrink-0 group-hover:bg-danger/20 transition-colors">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-black text-text-muted mb-0.5">Total Sanctions</p>
            <h3 className="text-2xl font-black text-danger leading-none">-{totalDeducted}</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-6 bg-gold/5 border-gold/10 group">
          <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center text-gold shrink-0 group-hover:bg-gold/20 transition-colors">
            <Coins size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-black text-text-muted mb-0.5">Elite Accumulator</p>
            <h3 className="text-xl font-black text-white leading-none uppercase truncate max-w-[150px]">
              {topEarner ? topEarner.playerName : "N/A"}
            </h3>
            <p className="text-[10px] font-bold text-gold mt-1 uppercase tracking-widest">{topEarner?.royalPoints || 0} Total Credits</p>
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surface-hover/50 text-[10px] uppercase tracking-[0.2em] font-black text-text-muted border-b border-white/5">
                <th className="p-5">Timestamp</th>
                <th className="p-5">Operational ID</th>
                <th className="p-5">Adjustment Objective</th>
                <th className="p-5 text-right">Credit Delta</th>
                <th className="p-5">Authorized By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedPoints.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-white/5 transition-all duration-200 group"
                >
                  <td className="p-5 text-xs font-bold text-text-muted whitespace-nowrap">
                    {tx.date}
                  </td>
                  <td className="p-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black text-white">
                        {getMemberName(tx.memberId).substring(0,2).toUpperCase()}
                      </div>
                      <span className="font-black text-white uppercase tracking-tighter group-hover:text-gold transition-colors">
                        {getMemberName(tx.memberId)}
                      </span>
                    </div>
                  </td>
                  <td className="p-5">
                    <p className="text-sm font-medium text-text-muted">
                      {tx.reason}
                    </p>
                  </td>
                  <td className="p-5 text-right whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 font-black text-xl ${tx.change > 0 ? "text-success" : "text-danger"}`}
                    >
                      {tx.change > 0 ? "+" : "-"}
                      {Math.abs(tx.change)}
                    </span>
                  </td>
                  <td className="p-5">
                    <Badge variant="default" className="bg-surface-hover/50">{tx.addedBy}</Badge>
                  </td>
                </tr>
              ))}
              {sortedPoints.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center opacity-30">
                       <Coins size={48} className="mb-4" />
                       <p className="font-black uppercase tracking-widest">No Credits Issued</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
