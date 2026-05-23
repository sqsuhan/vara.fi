import React from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { arcTestnet } from "./wagmi";
import Dashboard from "./components/Dashboard";
import DepositPanel from "./components/DepositPanel";
import BorrowPanel from "./components/BorrowPanel";
import RepayPanel from "./components/RepayPanel";
import WithdrawPanel from "./components/WithdrawPanel";
import FaucetPanel from "./components/FaucetPanel";
import SwapPage from "./components/SwapPage";

function Dapp() {
  const [activeTab, setActiveTab] = React.useState("markets");
  const { isConnected, address } = useAccount();
  const { connectors, isPending } = useConnect();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  
  // Refined network check: ensure we are connected and the chainId is exactly arcTestnet.id
  const isWrongNetwork = isConnected && chainId !== arcTestnet.id;

  return (
    <div className="min-h-screen bg-[#f4f7f9] relative overflow-x-hidden selection:bg-blue-500/30 selection:text-white">
      {/* Top Ticker Bar */}
      <div className="w-full bg-white/80 border-b border-gray-200 backdrop-blur-sm py-2 overflow-hidden relative z-[60]">
        <div className="flex whitespace-nowrap animate-marquee group cursor-default">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 mx-4">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]"></div>
                Powered by Arc Network
              </span>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]"></div>
                Seamless DeFi Experience
              </span>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]"></div>
                Zero Slippage Borrowing
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none mix-blend-multiply filter invert"></div>

      {/* Floating Ethereal Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[150px] animate-float-slow pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-400/20 rounded-full blur-[150px] animate-float-fast pointer-events-none"></div>
      <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-purple-400/15 rounded-full blur-[120px] animate-float-slow animation-delay-2000 pointer-events-none"></div>

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer hover-scale">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-gray-900 leading-none">
                  Vara.fi
                </span>
                <span className="text-[10px] font-bold text-blue-600 tracking-[0.2em] uppercase mt-1 opacity-80">
                  Unlocked on Arc
                </span>
              </div>
            </div>

            {isConnected && (
              <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                <button 
                  onClick={() => setActiveTab("markets")}
                  className={`text-sm font-bold tracking-wider uppercase transition-colors ${activeTab === "markets" ? "text-blue-600" : "text-gray-400 hover:text-gray-900"}`}
                >
                  Markets
                </button>
                <button 
                  onClick={() => setActiveTab("swap")}
                  className={`text-sm font-bold tracking-wider uppercase transition-colors ${activeTab === "swap" ? "text-blue-600" : "text-gray-400 hover:text-gray-900"}`}
                >
                  Swap
                </button>
                <button 
                  onClick={() => setActiveTab("portfolio")}
                  className={`text-sm font-bold tracking-wider uppercase transition-colors ${activeTab === "portfolio" ? "text-blue-600" : "text-gray-400 hover:text-gray-900"}`}
                >
                  Portfolio
                </button>
              </div>
            )}
            
            {isConnected ? (
              <div className="flex items-center gap-4 animate-slide-up">
                {isWrongNetwork ? (
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 shadow-inner">
                    <span className="text-sm font-bold tracking-wide">Wrong Network</span>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100/50 border border-gray-200 backdrop-blur-md shadow-inner">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                    <span className="text-sm font-semibold text-gray-700 tracking-wide">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => disconnect()}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all hover:shadow-sm"
                >
                  Disconnect
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-20">
        {!isConnected ? (
          <NotConnected 
            openConnectModal={openConnectModal} 
            isPending={isPending} 
          />
        ) : isWrongNetwork ? (
          <WrongNetwork 
            switchChain={() => switchChain({ chainId: arcTestnet.id })} 
            isSwitching={isSwitching} 
          />
        ) : (
          <div className="animate-slide-up">
            {activeTab === "markets" && (
              <div className="space-y-12">
                <FaucetPanel />
                <Dashboard />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                  <DepositPanel />
                  <BorrowPanel />
                  <RepayPanel />
                  <WithdrawPanel />
                </div>
              </div>
            )}
            {activeTab === "swap" && (
              <SwapPage />
            )}
            {activeTab === "portfolio" && (
              <div className="text-center mt-20">
                <h2 className="text-3xl font-black text-gray-900 mb-4">Portfolio</h2>
                <p className="text-gray-500">Portfolio view coming soon.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function WrongNetwork({ switchChain, isSwitching }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-slide-up">
      <div className="relative w-full max-w-xl mx-auto">
        <div className="absolute inset-0 bg-red-100 blur-3xl -z-10 rounded-[100px]"></div>
        
        <div className="glass-panel rounded-3xl p-10 border border-red-200 shadow-[0_0_40px_rgba(239,68,68,0.05)]">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
            Unsupported Network
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto font-medium">
            Vara.fi is currently deployed on the Arc Testnet. Please switch your wallet network to continue.
          </p>

          <button
            onClick={switchChain}
            disabled={isSwitching}
            className="btn-primary w-full py-4 rounded-2xl text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed mx-auto flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.2)] !from-red-500 !to-red-600 before:!from-red-400 before:!to-red-500"
          >
            {isSwitching ? (
              <>
                <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Switching Network...
              </>
            ) : (
              "Switch to Arc Testnet"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function NotConnected({ openConnectModal, isPending }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 animate-slide-up">
      <div className="relative w-full max-w-2xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-purple-100 to-indigo-100 blur-3xl -z-10 rounded-[100px]"></div>
        
        <div className="glass-panel rounded-3xl p-10 md:p-16 border border-white shadow-[0_0_50px_rgba(0,0,0,0.05)]">
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.3)] animate-pulse-glow">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 mb-6 tracking-tight">
            Lending, <br /> Unlocked on Arc
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mb-12 max-w-lg mx-auto font-medium leading-relaxed">
            Supply assets, earn yield, and borrow against collateral instantly with zero slippage.
          </p>

          <button
            onClick={() => openConnectModal()}
            disabled={isPending}
            className="btn-primary w-full md:w-auto px-10 py-5 rounded-2xl text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed mx-auto flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(59,130,246,0.2)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]"
          >
            {isPending ? (
              <>
                <svg className="w-6 h-6 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Initializing Core...
              </>
            ) : (
              <>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                Connect Wallet to Enter
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dapp;
