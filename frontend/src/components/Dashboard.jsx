import React from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { arcTestnet } from "../wagmi";
import LendingPoolABI from "../abi/LendingPool.json";

const LENDING_POOL = import.meta.env.VITE_LENDING_POOL_ADDRESS || "0x0000000000000000000000000000000000000000";

export default function Dashboard() {
  const { address } = useAccount();

  const { data: posData, error: readError } = useReadContract({
    address: LENDING_POOL,
    abi: LendingPoolABI,
    functionName: "getPosition",
    args: [address],
    chainId: arcTestnet.id,
    query: {
      enabled: !!address && LENDING_POOL !== "0x0000000000000000000000000000000000000000",
      refetchInterval: 5000, 
    },
  });

  const collateral = posData ? posData[0] : 0n;
  const borrowed = posData ? posData[1] : 0n;
  const interest = posData ? posData[2] : 0n;
  const maxBorrow = posData ? posData[3] : 0n;
  const healthFactor = posData ? posData[4] : 0n; // scaled by 1e18

  // Formatting
  const colFmt = collateral ? parseFloat(formatUnits(collateral, 18)).toFixed(4) : "0.0000";
  const borrowFmt = borrowed ? parseFloat(formatUnits(borrowed, 6)).toFixed(4) : "0.0000";
  const intFmt = interest ? parseFloat(formatUnits(interest, 6)).toFixed(6) : "0.000000";
  
  // Health factor display (e.g. 1.25)
  const hfVal = healthFactor ? parseFloat(formatUnits(healthFactor, 18)) : 0;
  let hfDisplay = "—";
  let hfColor = "text-slate-400";
  let hfBg = "bg-slate-500/20";
  let hfShadow = "shadow-none";
  let hfGradient = "from-slate-500 to-slate-400";

  if (borrowed > 0n) {
    hfDisplay = hfVal.toFixed(2);
    if (hfVal >= 1.5) {
      hfColor = "text-cyber-cyan";
      hfBg = "bg-cyber-cyan/10";
      hfShadow = "shadow-[0_0_20px_rgba(0,229,255,0.4)]";
      hfGradient = "from-[#00E5FF] to-[#0088FF]";
    } else if (hfVal >= 1.0) {
      hfColor = "text-amber-400";
      hfBg = "bg-amber-500/10";
      hfShadow = "shadow-[0_0_20px_rgba(251,191,36,0.4)]";
      hfGradient = "from-amber-400 to-amber-600";
    } else {
      hfColor = "text-cyber-pink";
      hfBg = "bg-cyber-pink/10";
      hfShadow = "shadow-[0_0_20px_rgba(255,0,122,0.4)]";
      hfGradient = "from-[#FF007A] to-[#B535F6]";
    }
  }

  return (
    <div className="glass-panel rounded-3xl p-6 lg:p-8 animate-slide-up relative overflow-hidden">
      {/* Decorative grid overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none mix-blend-screen"></div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 relative z-10">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Position Overview</h2>
          <p className="text-sm font-medium text-slate-400 mt-1">Real-time stats on Arc Testnet</p>
          {readError && (
            <p className="text-[10px] text-red-400 font-bold mt-2 uppercase tracking-widest">
              ⚠️ Contract Error: {readError.shortMessage || "Failed to fetch data"}
            </p>
          )}
        </div>
        
        {/* Health Factor Display */}
        <div className={`flex items-center gap-4 px-5 py-3 rounded-2xl border border-white/10 ${hfBg} transition-all duration-500`}>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Health Factor</p>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-black tracking-tighter ${hfColor} drop-shadow-md`}>
                {hfDisplay}
              </span>
            </div>
          </div>
          {borrowed > 0n && (
             <div className={`w-3 h-10 rounded-full bg-gradient-to-b ${hfGradient} ${hfShadow}`}></div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {/* Collateral Card */}
        <div className="rounded-2xl bg-midnight-800/80 p-5 border border-white/5 hover:border-cyber-cyan/30 transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(0,229,255,0.2)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyber-cyan/10 flex items-center justify-center border border-cyber-cyan/20 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5 text-cyber-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collateral</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white tracking-tight">{colFmt}</span>
            <span className="text-sm font-bold text-cyber-cyan">MCOL</span>
          </div>
        </div>

        {/* Borrowed Card */}
        <div className="rounded-2xl bg-midnight-800/80 p-5 border border-white/5 hover:border-cyber-purple/30 transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(181,53,246,0.2)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyber-purple/10 flex items-center justify-center border border-cyber-purple/20 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5 text-cyber-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Debt</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white tracking-tight">{borrowFmt}</span>
            <span className="text-sm font-bold text-cyber-purple">USDC</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
            <span className="text-slate-500">Interest:</span>
            <span className="text-amber-400">+{intFmt} USDC</span>
          </div>
        </div>

        {/* Available to Borrow */}
        <div className="rounded-2xl bg-midnight-800/80 p-5 border border-white/5 hover:border-cyber-pink/30 transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(255,0,122,0.2)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyber-pink/10 flex items-center justify-center border border-cyber-pink/20 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5 text-cyber-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available to Borrow</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white tracking-tight">
              {maxBorrow ? parseFloat(formatUnits(maxBorrow, 6)).toFixed(4) : "0.0000"}
            </span>
            <span className="text-sm font-bold text-cyber-pink">USDC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
