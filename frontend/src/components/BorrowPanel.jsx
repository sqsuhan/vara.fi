import React, { useState } from "react";
import { useAccount, useWriteContract, useReadContract, useConfig } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { waitForTransactionReceipt } from "wagmi/actions";
import { arcTestnet } from "../wagmi";
import LendingPoolABI from "../abi/LendingPool.json";
import { LENDING_POOL } from "../constants/addresses";

export default function BorrowPanel() {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [step, setStep] = useState("idle");

  const config = useConfig();
  const { writeContractAsync: writeAsync } = useWriteContract();

  const { data: posData } = useReadContract({
    address: LENDING_POOL,
    abi: LendingPoolABI,
    functionName: "getPosition",
    args: [address],
    chainId: arcTestnet.id,
    query: { enabled: !!address, refetchInterval: 6000 },
  });

  const maxBorrow = posData ? posData[3] : 0n;
  const maxBorrowFormatted = maxBorrow
    ? parseFloat(formatUnits(maxBorrow, 6)).toFixed(4)
    : "0";

  const isLoading = step === "borrowing";

  async function handleBorrow(e) {
    e.preventDefault();
    if (!amount || !address) return;

    try {
      const parsed = parseUnits(amount, 6);
      setStep("borrowing");
      setStatus("Borrowing USDC from protocol…");

      const hash = await writeAsync({
        address: LENDING_POOL,
        abi: LendingPoolABI,
        functionName: "borrow",
        args: [parsed],
        chainId: arcTestnet.id,
      });

      setStatus("Finalizing borrow…");
      await waitForTransactionReceipt(config, { hash });

      setStep("success");
      setStatus(`Borrow successful! Your USDC balance has been updated.`);
      setAmount("");
    } catch (err) {
      setStep("error");
      setStatus(err?.shortMessage || err?.message || "Transaction failed");
    }
  }

  function setMax() {
    if (maxBorrow) setAmount(formatUnits(maxBorrow, 6));
  }

  return (
    <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group">
      {/* Decorative gradient orb */}
      <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-cyber-purple/20 blur-[60px] rounded-full pointer-events-none transition-all duration-500 group-hover:bg-cyber-purple/40"></div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-cyber-purple/10 border border-cyber-purple/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
          <svg className="w-6 h-6 text-cyber-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">Borrow</h3>
          <p className="text-sm text-slate-400 font-medium">Get liquidity against your collateral</p>
        </div>
      </div>

      {/* Info Block */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-midnight-800/80 border border-white/5 mb-4 relative z-10">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Max Borrowable</span>
        <span className="text-sm font-black text-cyber-purple tracking-tight">{maxBorrowFormatted} USDC</span>
      </div>

      <form onSubmit={handleBorrow} className="space-y-4 relative z-10">
        <div className="relative">
          <input
            type="number"
            min="0"
            step="any"
            placeholder="0.00"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setStep("idle"); setStatus(""); }}
            disabled={isLoading}
            className="w-full glass-input rounded-2xl px-5 py-4 text-2xl font-bold text-white placeholder-slate-600 disabled:opacity-50 tracking-tight"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={setMax}
              className="px-2.5 py-1.5 text-xs font-black bg-cyber-purple/10 text-cyber-purple hover:bg-cyber-purple/20 rounded-lg transition-colors uppercase tracking-widest border border-cyber-purple/20"
            >
              Max
            </button>
            <span className="text-sm font-black text-slate-300 pr-2">USDC</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !amount}
          className="btn-primary w-full py-4 rounded-2xl text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && <Spinner />}
          {isLoading ? "Executing..." : "Borrow Asset"}
        </button>

        {/* Status */}
        <div className={`transition-all duration-300 overflow-hidden ${status ? 'max-h-24 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
          {status && (
            <div className={`text-xs font-bold rounded-xl px-4 py-3 ${
              step === "error"
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : step === "success"
                ? "bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20"
                : "bg-cyber-purple/10 text-cyber-purple border border-cyber-purple/20"
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
