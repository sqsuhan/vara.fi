import React, { useState } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { parseUnits, formatUnits, maxUint256 } from "viem";
import { arcTestnet } from "../wagmi";
import LendingPoolABI from "../abi/LendingPool.json";
import ERC20ABI from "../abi/ERC20.json";

const LENDING_POOL = import.meta.env.VITE_LENDING_POOL_ADDRESS || "0x0000000000000000000000000000000000000000";
const MCOL_ADDRESS = import.meta.env.VITE_COLLATERAL_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";

export default function DepositPanel() {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [step, setStep] = useState("idle"); 

  const { writeContractAsync: writeAsync } = useWriteContract();

  const { data: colBalance } = useReadContract({
    address: MCOL_ADDRESS,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: [address],
    chainId: arcTestnet.id,
    query: { enabled: !!address, refetchInterval: 6000 },
  });

  const colBalanceFormatted = colBalance ? parseFloat(formatUnits(colBalance, 18)).toFixed(4) : "0";

  const isLoading = step === "approving" || step === "depositing";

  async function handleDeposit(e) {
    e.preventDefault();
    if (!amount || !address) return;

    try {
      const parsed = parseUnits(amount, 18);
      
      setStep("approving");
      setStatus("Requesting MCOL approval…");

      await writeAsync({
        address: MCOL_ADDRESS,
        abi: ERC20ABI,
        functionName: "approve",
        args: [LENDING_POOL, maxUint256],
        chainId: arcTestnet.id,
      });

      setStep("depositing");
      setStatus("Depositing to Vara.fi…");

      const tx = await writeAsync({
        address: LENDING_POOL,
        abi: LendingPoolABI,
        functionName: "deposit",
        args: [parsed],
        chainId: arcTestnet.id,
      });

      setStep("success");
      setStatus(`Deposit successful! Tx: ${tx.slice(0, 10)}…`);
      setAmount("");
    } catch (err) {
      setStep("error");
      setStatus(err?.shortMessage || err?.message || "Transaction failed");
    }
  }

  function setMax() {
    if (colBalance) setAmount(formatUnits(colBalance, 18));
  }

  const btnText = 
    step === "approving" ? "Approving..." : 
    step === "depositing" ? "Depositing..." : 
    "Deposit Asset";

  return (
    <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group">
      {/* Decorative gradient orb */}
      <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-cyber-cyan/20 blur-[60px] rounded-full pointer-events-none transition-all duration-500 group-hover:bg-cyber-cyan/40"></div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
          <svg className="w-6 h-6 text-cyber-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">Deposit</h3>
          <p className="text-sm text-slate-400 font-medium">Supply MCOL as collateral</p>
        </div>
      </div>

      {/* Info Block */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-midnight-800/80 border border-white/5 mb-4 relative z-10">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wallet Balance</span>
        <span className="text-sm font-black text-cyber-cyan tracking-tight">{colBalanceFormatted} MCOL</span>
      </div>

      <form onSubmit={handleDeposit} className="space-y-4 relative z-10">
        <div className="relative">
          <input
            type="number"
            min="0"
            step="any"
            placeholder="0.00"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setStep("idle"); setStatus(""); }}
            disabled={isLoading}
            className="w-full glass-input rounded-2xl px-5 py-4 text-2xl font-bold text-white placeholder-slate-600 disabled:opacity-50 tracking-tight focus:border-cyber-cyan/60 focus:shadow-[0_0_0_3px_rgba(0,229,255,0.15),inset_0_2px_4px_rgba(0,0,0,0.2)]"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={setMax}
              className="px-2.5 py-1.5 text-xs font-black bg-cyber-cyan/10 text-cyber-cyan hover:bg-cyber-cyan/20 rounded-lg transition-colors uppercase tracking-widest border border-cyber-cyan/20"
            >
              Max
            </button>
            <span className="text-sm font-black text-slate-300 pr-2">MCOL</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !amount}
          className="btn-primary w-full py-4 rounded-2xl text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && <Spinner />}
          {btnText}
        </button>

        {/* Status */}
        <div className={`transition-all duration-300 overflow-hidden ${status ? 'max-h-24 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
          {status && (
            <div className={`text-xs font-bold rounded-xl px-4 py-3 ${
              step === "error"
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20"
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
