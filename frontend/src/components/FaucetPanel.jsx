import React, { useState } from "react";
import { useAccount, useWriteContract, useReadContract, useConfig } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { waitForTransactionReceipt } from "wagmi/actions";
import { arcTestnet } from "../wagmi";
import MockCollateralTokenABI from "../abi/MockCollateralToken.json";
import MockUSDCABI from "../abi/MockUSDC.json";
import { MCOL_ADDRESS, USDC_ADDRESS } from "../constants/addresses";

export default function FaucetPanel() {
  const { address } = useAccount();
  const [status, setStatus] = useState("");
  const [step, setStep] = useState("idle");
  const [mintingToken, setMintingToken] = useState("");

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

  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: MockUSDCABI,
    functionName: "balanceOf",
    args: [address],
    chainId: arcTestnet.id,
    query: { enabled: !!address, refetchInterval: 6000 },
  });

  const isLoading = step === "minting";
  const mcolBal = colBalance ? parseFloat(formatUnits(colBalance, 18)) : 0;
  const usdcBal = usdcBalance ? parseFloat(formatUnits(usdcBalance, 6)) : 0;
  
  const canMintMcol = mcolBal < 1000;
  const mintMcolAmount = 100;

  const canMintUsdc = usdcBal < 1000;
  const mintUsdcAmount = 100;

  async function handleMint(tokenType) {
    if (!address) return;

    try {
      setStep("minting");
      setMintingToken(tokenType);
      const amount = tokenType === "MCOL" ? mintMcolAmount : mintUsdcAmount;
      setStatus(`Minting ${amount} ${tokenType} from Faucet…`);

      const addressToUse = tokenType === "MCOL" ? MCOL_ADDRESS : USDC_ADDRESS;
      const abiToUse = tokenType === "MCOL" ? MockCollateralTokenABI : MockUSDCABI;
      const parsedAmount = tokenType === "MCOL" ? parseUnits(amount.toString(), 18) : parseUnits(amount.toString(), 6);

      const hash = await writeAsync({
        address: addressToUse,
        abi: abiToUse,
        functionName: "mint",
        args: [address, parsedAmount],
        chainId: arcTestnet.id,
      });

      setStatus("Finalizing mint…");
      await waitForTransactionReceipt(config, { hash });

      setStep("success");
      setStatus(`Successfully minted ${amount} ${tokenType}!`);
      setMintingToken("");
    } catch (err) {
      setStep("error");
      setStatus(err?.shortMessage || err?.message || "Transaction failed");
      setMintingToken("");
    }
  }

  return (
    <div className="glass-panel rounded-3xl p-6 relative overflow-hidden group mb-8">
      {/* Decorative gradient orb */}
      <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-amber-200/50 blur-[60px] rounded-full pointer-events-none transition-all duration-500 group-hover:bg-amber-300/50"></div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Testnet Faucet</h3>
            <p className="text-sm text-gray-500 font-medium">Mint test tokens for the protocol</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3">
          <button
            onClick={() => handleMint("USDC")}
            disabled={isLoading || !canMintUsdc}
            className="px-6 py-3 rounded-xl text-sm font-bold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all hover:shadow-sm flex items-center gap-2 uppercase tracking-widest whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && mintingToken === "USDC" && <Spinner />}
            {isLoading && mintingToken === "USDC" ? "Minting..." : !canMintUsdc ? "USDC Limit Reached" : "Get Test USDC"}
          </button>
          <button
            onClick={() => handleMint("MCOL")}
            disabled={isLoading || !canMintMcol}
            className="btn-primary px-8 py-3 rounded-xl text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 !from-amber-400 !to-amber-600 before:!from-amber-300 before:!to-amber-500 whitespace-nowrap"
          >
            {isLoading && mintingToken === "MCOL" && <Spinner />}
            {isLoading && mintingToken === "MCOL" ? "Minting..." : !canMintMcol ? "MCOL Limit Reached" : "Mint 100 MCOL"}
          </button>
        </div>
      </div>

      {/* Status */}
      <div className={`transition-all duration-300 overflow-hidden relative z-10 ${status ? 'max-h-24 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        {status && (
          <div className={`text-xs font-bold rounded-xl px-4 py-3 ${
            step === "error"
              ? "bg-red-50 text-red-500 border border-red-100"
              : "bg-amber-50 text-amber-500 border border-amber-100"
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
