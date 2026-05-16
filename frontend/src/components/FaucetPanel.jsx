import React, { useState } from "react";
import { useAccount, useWriteContract, useReadContract, useConfig } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { waitForTransactionReceipt } from "wagmi/actions";
import { arcTestnet } from "../wagmi";
import MockCollateralTokenABI from "../abi/MockCollateralToken.json";
import { MCOL_ADDRESS } from "../constants/addresses";

export default function FaucetPanel() {
  const { address } = useAccount();
  const [status, setStatus] = useState("");
  const [step, setStep] = useState("idle");

  const config = useConfig();
  const { writeContractAsync: writeAsync } = useWriteContract();

  const { data: colBalance } = useReadContract({
    address: MCOL_ADDRESS,
    abi: MockCollateralTokenABI,
    functionName: "balanceOf",
    args: [address],
    chainId: arcTestnet.id,
    query: { enabled: !!address, refetchInterval: 6000 },
  });

  const isLoading = step === "minting";
  const balance = colBalance ? parseFloat(formatUnits(colBalance, 18)) : 0;
  
  // They can only mint if they have less than 100 MCOL
  const canMint = balance < 100;
  const mintAmount = 100;

  async function handleMint() {
    if (!address) return;

    try {
      setStep("minting");
      setStatus("Minting 100 MCOL from Faucet…");

      const hash = await writeAsync({
        address: MCOL_ADDRESS,
        abi: MockCollateralTokenABI,
        functionName: "mint",
        args: [address, parseUnits(mintAmount.toString(), 18)],
        chainId: arcTestnet.id,
      });

      setStatus("Finalizing mint…");
      await waitForTransactionReceipt(config, { hash });

      setStep("success");
      setStatus(`Successfully minted 100 MCOL!`);
    } catch (err) {
      setStep("error");
      setStatus(err?.shortMessage || err?.message || "Transaction failed");
    }
  }

  return (
    <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group mb-8">
      {/* Decorative gradient orb */}
      <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-amber-400/20 blur-[60px] rounded-full pointer-events-none transition-all duration-500 group-hover:bg-amber-400/40"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Testnet Faucet</h3>
            <p className="text-sm text-slate-400 font-medium">Mint test MCOL to use as collateral</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3">
          <a
            href="https://faucet.circle.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2 uppercase tracking-widest whitespace-nowrap"
          >
            Get Test USDC
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
          <button
            onClick={handleMint}
            disabled={isLoading || !canMint}
            className="btn-primary px-8 py-3 rounded-xl text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 !from-amber-400 !to-amber-600 before:!from-amber-300 before:!to-amber-500 whitespace-nowrap"
          >
            {isLoading && <Spinner />}
            {isLoading ? "Minting..." : !canMint ? "MCOL Limit Reached" : "Mint 100 MCOL"}
          </button>
        </div>
      </div>

      {/* Status */}
      <div className={`transition-all duration-300 overflow-hidden relative z-10 ${status ? 'max-h-24 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        {status && (
          <div className={`text-xs font-bold rounded-xl px-4 py-3 ${
            step === "error"
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
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
