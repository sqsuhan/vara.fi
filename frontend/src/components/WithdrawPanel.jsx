import React, { useState } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import LendingPoolABI from "../abi/LendingPool.json";

const LENDING_POOL = import.meta.env.VITE_LENDING_POOL_ADDRESS || "0x0000000000000000000000000000000000000000";

export default function WithdrawPanel() {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [step, setStep] = useState("idle");

  const { writeContractAsync: writeAsync } = useWriteContract();

  const { data: posData } = useReadContract({
    address: LENDING_POOL,
    abi: LendingPoolABI,
    functionName: "getPosition",
    args: [address],
    query: { enabled: !!address, refetchInterval: 6000 },
  });

  const collateral = posData ? posData[0] : 0n;
  const borrowed = posData ? posData[1] : 0n;
  const collateralFormatted = collateral ? parseFloat(formatUnits(collateral, 18)).toFixed(4) : "0";
  const hasLoan = borrowed > 0n;

  const isLoading = step === "withdrawing";

  async function handleWithdraw(e) {
    e.preventDefault();
    if (!amount || !address) return;

    try {
      const parsed = parseUnits(amount, 18);
      setStep("withdrawing");
      setStatus("Withdrawing MCOL collateral…");

      const tx = await writeAsync({
        address: LENDING_POOL,
        abi: LendingPoolABI,
        functionName: "withdraw",
        args: [parsed],
      });

      setStep("success");
      setStatus(`Withdrawal successful! Tx: ${tx.slice(0, 10)}…`);
      setAmount("");
    } catch (err) {
      setStep("error");
      setStatus(err?.shortMessage || err?.message || "Transaction failed");
    }
  }

  function setMax() {
    if (collateral) setAmount(formatUnits(collateral, 18));
  }

  return (
    <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group">
      {/* Decorative gradient orb */}
      <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-[#FF3B30]/20 blur-[60px] rounded-full pointer-events-none transition-all duration-500 group-hover:bg-[#FF3B30]/40"></div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
          <svg className="w-6 h-6 text-[#FF3B30]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">Withdraw</h3>
          <p className="text-sm text-slate-400 font-medium">Reclaim MCOL collateral</p>
        </div>
      </div>

      {/* Info Block */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-midnight-800/80 border border-white/5 mb-4 relative z-10">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available</span>
        <span className="text-sm font-black text-[#FF3B30] tracking-tight">{collateralFormatted} MCOL</span>
      </div>

      {/* Active loan warning */}
      {hasLoan && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-bold flex items-start gap-2 relative z-10 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Repay your active loan before withdrawing collateral.</span>
        </div>
      )}

      <form onSubmit={handleWithdraw} className="space-y-4 relative z-10">
        <div className="relative">
          <input
            type="number"
            min="0"
            step="any"
            placeholder="0.00"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setStep("idle"); setStatus(""); }}
            disabled={isLoading || hasLoan}
            className="w-full glass-input rounded-2xl px-5 py-4 text-2xl font-bold text-white placeholder-slate-600 disabled:opacity-50 tracking-tight focus:border-[#FF3B30]/60 focus:shadow-[0_0_0_3px_rgba(255,59,48,0.15),inset_0_2px_4px_rgba(0,0,0,0.2)]"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={setMax}
              disabled={hasLoan}
              className="px-2.5 py-1.5 text-xs font-black bg-[#FF3B30]/10 text-[#FF3B30] hover:bg-[#FF3B30]/20 rounded-lg transition-colors uppercase tracking-widest border border-[#FF3B30]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Max
            </button>
            <span className="text-sm font-black text-slate-300 pr-2">MCOL</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !amount || hasLoan}
          className="btn-primary w-full py-4 rounded-2xl text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 !from-[#FF3B30] !to-[#FF453A] before:!from-[#FF6961] before:!to-[#FF453A]"
        >
          {isLoading && <Spinner />}
          {isLoading ? "Withdrawing..." : "Withdraw MCOL"}
        </button>

        {/* Status */}
        <div className={`transition-all duration-300 overflow-hidden ${status ? 'max-h-24 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
          {status && (
            <div className={`text-xs font-bold rounded-xl px-4 py-3 ${
              step === "error"
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20"
            }`}>
              {status}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
