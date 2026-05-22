import React, { useState } from "react";
import { useAccount, useWriteContract, useReadContract, useConfig } from "wagmi";
import { formatUnits, maxUint256 } from "viem";
import { waitForTransactionReceipt } from "wagmi/actions";
import { arcTestnet } from "../wagmi";
import LendingPoolABI from "../abi/LendingPool.json";
import ERC20ABI from "../abi/ERC20.json";
import { LENDING_POOL, USDC_ADDRESS } from "../constants/addresses";

export default function RepayPanel() {
  const { address } = useAccount();
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

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: [address],
    chainId: arcTestnet.id,
    query: { enabled: !!address, refetchInterval: 6000 },
  });

  const borrowed = posData ? posData[1] : 0n; // 6 dec USDC
  const interest = posData ? posData[2] : 0n; // 6 dec USDC
  const totalDue = borrowed + interest;
  const usdcBal = usdcBalance || 0n;

  const isLoading = step === "approving" || step === "repaying";
  const hasloan = borrowed > 0n;
  const insufficientBalance = hasloan && usdcBal < totalDue;

  async function handleRepay() {
    if (!address || !hasloan) return;

    try {
      setStep("approving");
      setStatus("Approving USDC transfer…");

      const approveHash = await writeAsync({
        address: USDC_ADDRESS,
        abi: ERC20ABI,
        functionName: "approve",
        args: [LENDING_POOL, maxUint256],
        chainId: arcTestnet.id,
      });

      setStatus("Waiting for approval confirmation…");
      await waitForTransactionReceipt(config, { hash: approveHash });

      setStep("repaying");
      setStatus("Repaying loan…");

      const repayHash = await writeAsync({
        address: LENDING_POOL,
        abi: LendingPoolABI,
        functionName: "repay",
        chainId: arcTestnet.id,
      });

      setStatus("Finalizing repayment…");
      await waitForTransactionReceipt(config, { hash: repayHash });

      setStep("success");
      setStatus(`Loan repaid successfully!`);
    } catch (err) {
      setStep("error");
      setStatus(err?.shortMessage || err?.message || "Transaction failed");
    }
  }

  const btnText =
    step === "approving" ? "Approving…" :
    step === "repaying" ? "Repaying…" :
    insufficientBalance ? "Insufficient USDC Balance" :
    "Repay All";

  return (
    <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group">
      {/* Decorative gradient orb */}
      <div className="absolute bottom-[-50px] right-[-50px] w-32 h-32 bg-emerald-200/50 blur-[60px] rounded-full pointer-events-none transition-all duration-500 group-hover:bg-emerald-300/50"></div>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">Repay Loan</h3>
          <p className="text-sm text-gray-500 font-medium">Repay your full debt + interest</p>
        </div>
      </div>

      {/* Repayment breakdown */}
      <div className="space-y-3 mb-6 relative z-10">
        <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-white/80 border border-gray-200">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Wallet Balance</span>
          <span className={`text-sm font-black tracking-tight ${insufficientBalance ? 'text-red-500' : 'text-gray-900'}`}>
            {parseFloat(formatUnits(usdcBal, 6)).toFixed(4)} USDC
          </span>
        </div>
        <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-white/80 border border-gray-200">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Principal</span>
          <span className="text-sm font-black text-gray-900 tracking-tight">
            {parseFloat(formatUnits(borrowed, 6)).toFixed(4)} USDC
          </span>
        </div>
        <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-white/80 border border-gray-200">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Accrued Interest</span>
          <span className="text-sm font-black text-amber-500 tracking-tight">
            +{parseFloat(formatUnits(interest, 6)).toFixed(6)} USDC
          </span>
        </div>
        <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
          <span className="text-xs font-black text-emerald-500 uppercase tracking-wider">Total Due</span>
          <span className="text-sm font-black text-emerald-500 tracking-tight">
            {parseFloat(formatUnits(totalDue, 6)).toFixed(6)} USDC
          </span>
        </div>
      </div>

      <button
        onClick={handleRepay}
        disabled={isLoading || !hasloan || insufficientBalance}
        className="btn-primary w-full py-4 rounded-2xl text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 !from-emerald-400 !to-emerald-600 before:!from-emerald-300 before:!to-emerald-500"
      >
        {isLoading && <Spinner />}
        {hasloan ? btnText : "No Active Loan"}
      </button>

      {/* Status */}
      <div className={`transition-all duration-300 overflow-hidden relative z-10 ${status ? 'max-h-24 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        {status && (
          <div className={`text-xs font-bold rounded-xl px-4 py-3 ${
            step === "error"
              ? "bg-red-50 text-red-500 border border-red-100"
              : "bg-emerald-50 text-emerald-500 border border-emerald-100"
          }`}>
            {status}
          </div>
        )}
      </div>
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
