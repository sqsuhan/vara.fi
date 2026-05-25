import React, { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useConfig, useBalance } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { waitForTransactionReceipt, readContract } from "wagmi/actions";
import { arcTestnet } from "../wagmi";
import VaraSwapABI from "../abi/VaraSwap.json";
import { SWAP_ADDRESS, EUR_ADDRESS, CIRBTC_ADDRESS, USDC_NATIVE, VAUSDC_ADDRESS } from "../constants/addresses";

const erc20Abi = [
  { type: 'function', name: 'approve', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  { type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'decimals', inputs: [], outputs: [{ type: 'uint8' }] },
  { type: 'function', name: 'allowance', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] }
];

const TOKENS = {
  EUR: { symbol: "EUR", address: EUR_ADDRESS, decimals: 18, icon: "🇪🇺" },
  CIRBTC: { symbol: "cirBTC", address: CIRBTC_ADDRESS, decimals: 8, icon: "₿" },
  USDC: { symbol: "USDC Native", address: USDC_NATIVE, decimals: 6, icon: "💵" },
  VAUSDC: { symbol: "VaUSDC", address: VAUSDC_ADDRESS, decimals: 6, icon: "🔵" }
};

const PAIRS = {
  EUR: ["USDC", "VAUSDC"],
  CIRBTC: ["USDC", "VAUSDC"],
  USDC: ["VAUSDC"],
  VAUSDC: ["USDC"]
};

export default function SwapPage() {
  const { address } = useAccount();
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();

  const [fromTokenKey, setFromTokenKey] = useState("EUR");
  const [toTokenKey, setToTokenKey] = useState("USDC");
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("0.00");
  const [exchangeRate, setExchangeRate] = useState("0");
  
  const [status, setStatus] = useState("");
  const [step, setStep] = useState("idle");
  const [txHash, setTxHash] = useState("");

  const fromToken = TOKENS[fromTokenKey];
  const toToken = TOKENS[toTokenKey];

  // Fetch Balances
  const { data: fromBalData } = useReadContract({
    address: fromToken.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
    chainId: arcTestnet.id,
    query: { enabled: !!address, refetchInterval: 6000 },
  });
  const fromBalance = fromBalData ? formatUnits(fromBalData, fromToken.decimals) : "0";

  // Fetch Exchange Rate
  const { data: rateData } = useReadContract({
    address: SWAP_ADDRESS,
    abi: VaraSwapABI.abi,
    functionName: "getRate",
    args: [fromToken.address, toToken.address],
    chainId: arcTestnet.id,
    query: { enabled: true, refetchInterval: 10000 },
  });

  useEffect(() => {
    if (rateData) {
      setExchangeRate(formatUnits(rateData, 18));
    }
  }, [rateData]);

  // Calculate Output Amount live
  const { data: outData } = useReadContract({
    address: SWAP_ADDRESS,
    abi: VaraSwapABI.abi,
    functionName: "getAmountOut",
    args: [fromToken.address, toToken.address, amountIn ? parseUnits(amountIn, fromToken.decimals) : 0n],
    chainId: arcTestnet.id,
    query: { enabled: !!amountIn && Number(amountIn) > 0 },
  });

  useEffect(() => {
    if (amountIn && Number(amountIn) > 0 && outData !== undefined) {
      setAmountOut(formatUnits(outData, toToken.decimals));
    } else {
      setAmountOut("0.00");
    }
  }, [amountIn, outData, toToken.decimals]);

  // Handle Token Flip
  function handleFlip() {
    if (PAIRS[toTokenKey].includes(fromTokenKey)) {
      setFromTokenKey(toTokenKey);
      setToTokenKey(fromTokenKey);
      setAmountIn("");
      setStatus("");
      setStep("idle");
    }
  }

  // Handle Swap
  async function handleSwap(e) {
    e.preventDefault();
    if (!amountIn || !address) return;

    try {
      setStep("approving");
      setTxHash("");
      setStatus(`Approving ${fromToken.symbol}...`);
      
      const parsedAmount = parseUnits(amountIn, fromToken.decimals);

      // Check allowance
      const allowanceData = await readContract(config, {
        address: fromToken.address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address, SWAP_ADDRESS],
        chainId: arcTestnet.id,
      });

      if (allowanceData < parsedAmount) {
        const approveHash = await writeContractAsync({
          address: fromToken.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [SWAP_ADDRESS, parsedAmount],
          chainId: arcTestnet.id,
        });
        await waitForTransactionReceipt(config, { hash: approveHash });
      }

      setStep("swapping");
      setStatus(`Swapping ${fromToken.symbol} for ${toToken.symbol}...`);

      const swapHash = await writeContractAsync({
        address: SWAP_ADDRESS,
        abi: VaraSwapABI.abi,
        functionName: "swap",
        args: [fromToken.address, toToken.address, parsedAmount],
        chainId: arcTestnet.id,
      });

      setStatus("Finalizing swap...");
      await waitForTransactionReceipt(config, { hash: swapHash });

      setStep("success");
      setTxHash(swapHash);
      setStatus("Swap successful!");
      setAmountIn("");
    } catch (err) {
      setStep("error");
      setStatus(err?.shortMessage || err?.message || "Transaction failed");
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-12 animate-slide-up">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">VaraSwap</h2>
        <p className="text-gray-500 font-medium text-lg">Swap anything. Settle in USDC.</p>
      </div>

      <div className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden group shadow-sm bg-white/80 border border-gray-200">
        <form onSubmit={handleSwap} className="space-y-4">
          
          {/* FROM INPUT */}
          <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 transition-colors focus-within:border-blue-200 focus-within:bg-white">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">You Pay</span>
              <span className="text-xs font-bold text-gray-500">
                Balance: {parseFloat(fromBalance).toFixed(4)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={fromTokenKey}
                onChange={(e) => {
                  const newFrom = e.target.value;
                  setFromTokenKey(newFrom);
                  // Ensure To token is valid
                  if (!PAIRS[newFrom].includes(toTokenKey)) {
                    setToTokenKey(PAIRS[newFrom][0]);
                  }
                }}
                className="bg-white border border-gray-200 text-gray-900 font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {Object.keys(TOKENS).map(key => (
                  <option key={key} value={key}>{TOKENS[key].icon} {TOKENS[key].symbol}</option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                className="w-full bg-transparent text-right text-3xl font-black text-gray-900 placeholder-gray-300 outline-none"
              />
            </div>
          </div>

          {/* FLIP BUTTON */}
          <div className="flex justify-center -my-6 relative z-10">
            <button
              type="button"
              onClick={handleFlip}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-500 hover:scale-110 hover:shadow-md transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* TO INPUT */}
          <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">You Receive</span>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={toTokenKey}
                onChange={(e) => setToTokenKey(e.target.value)}
                className="bg-white border border-gray-200 text-gray-900 font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {PAIRS[fromTokenKey].map(key => (
                  <option key={key} value={key}>{TOKENS[key].icon} {TOKENS[key].symbol}</option>
                ))}
              </select>
              <input
                type="text"
                readOnly
                placeholder="0.00"
                value={amountOut}
                className="w-full bg-transparent text-right text-3xl font-black text-gray-900 placeholder-gray-300 outline-none"
              />
            </div>
          </div>

          {/* Exchange Rate Info */}
          <div className="flex justify-between items-center px-2 pt-2">
            <span className="text-xs text-gray-400 font-medium">Rate set by protocol</span>
            <span className="text-xs font-bold text-gray-600">
              1 {fromToken.symbol} = {parseFloat(exchangeRate).toFixed(4)} {toToken.symbol}
            </span>
          </div>

          <button
            type="submit"
            disabled={step === "approving" || step === "swapping" || !amountIn || Number(amountIn) <= 0}
            className="btn-primary w-full py-4 rounded-2xl text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-sm"
          >
            {step === "approving" ? "Approving..." : step === "swapping" ? "Swapping..." : "Swap"}
          </button>

          {/* Status */}
          <div className={`transition-all duration-300 overflow-hidden ${status ? 'max-h-32 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
            {status && (
              <div className={`text-sm font-bold rounded-xl px-4 py-3 ${
                step === "error"
                  ? "bg-red-50 text-red-500 border border-red-100"
                  : "bg-blue-50 text-blue-600 border border-blue-100"
              }`}>
                {status}
                {txHash && (
                  <div className="mt-2">
                    <a 
                      href={`https://testnet.arcscan.app/tx/${txHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs underline hover:text-blue-800"
                    >
                      View on Arcscan ↗
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
