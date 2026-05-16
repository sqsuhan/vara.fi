import React from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { arcTestnet } from "./wagmi";
import Dashboard from "./components/Dashboard";
import DepositPanel from "./components/DepositPanel";
import BorrowPanel from "./components/BorrowPanel";
import RepayPanel from "./components/RepayPanel";
import WithdrawPanel from "./components/WithdrawPanel";
import FaucetPanel from "./components/FaucetPanel";

function App() {
  const { isConnected, address } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const isWrongNetwork = isConnected && chainId !== arcTestnet.id;

  return (
    <div className="min-h-screen bg-midnight relative overflow-x-hidden selection:bg-cyber-cyan/30 selection:text-white">
      {/* Top Ticker Bar */}
      <div className="w-full bg-midnight-900/80 border-b border-white/5 backdrop-blur-sm py-2 overflow-hidden relative z-[60]">
        <div className="flex whitespace-nowrap animate-marquee group cursor-default">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 mx-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-cyber-cyan shadow-[0_0_5px_rgba(0,229,255,0.5)]"></div>
                Powered by Arc Network
              </span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-cyber-purple shadow-[0_0_5px_rgba(188,19,254,0.5)]"></div>
                Seamless DeFi Experience
              </span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-cyber-pink shadow-[0_0_5px_rgba(255,0,255,0.5)]"></div>
                Zero Slippage Borrowing
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none mix-blend-screen"></div>

      {/* Floating Ethereal Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyber-cyan/20 rounded-full blur-[150px] animate-float-slow pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyber-pink/10 rounded-full blur-[150px] animate-float-fast pointer-events-none mix-blend-screen"></div>
      <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-cyber-purple/15 rounded-full blur-[120px] animate-float-slow animation-delay-2000 pointer-events-none mix-blend-screen"></div>

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer hover-scale">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-cyan to-cyber-purple flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.3)] group-hover:shadow-[0_0_30px_rgba(0,229,255,0.6)] transition-all duration-300">
                <svg className="w-6 h-6 text-midnight" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 leading-none">
                  Vara.fi
                </span>
                <span className="text-[10px] font-bold text-cyber-cyan tracking-[0.2em] uppercase mt-1 opacity-80">
                  Unlocked on Arc
                </span>
              </div>
            </div>
            
            {isConnected ? (
              <div className="flex items-center gap-4 animate-slide-up">
                {isWrongNetwork ? (
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 shadow-inner">
                    <span className="text-sm font-bold tracking-wide">Wrong Network</span>
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-midnight-700/50 border border-white/5 backdrop-blur-md shadow-inner">
                    <div className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse shadow-[0_0_10px_rgba(0,229,255,0.8)]"></div>
                    <span className="text-sm font-semibold text-slate-300 tracking-wide">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => disconnect()}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
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
            connectors={connectors} 
            connect={connect} 
            isPending={isPending} 
          />
        ) : isWrongNetwork ? (
          <WrongNetwork 
            switchChain={() => switchChain({ chainId: arcTestnet.id })} 
            isSwitching={isSwitching} 
          />
        ) : (
          <div className="space-y-12 animate-slide-up">
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
      </main>
    </div>
  );
}

function WrongNetwork({ switchChain, isSwitching }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-slide-up">
      <div className="relative w-full max-w-xl mx-auto">
        <div className="absolute inset-0 bg-red-500/10 blur-3xl -z-10 rounded-[100px]"></div>
        
        <div className="glass-panel rounded-3xl p-10 border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.15)]">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/30">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
            Unsupported Network
          </h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto font-medium">
            Vara.fi is currently deployed on the Arc Testnet. Please switch your wallet network to continue.
          </p>

          <button
            onClick={switchChain}
            disabled={isSwitching}
            className="btn-primary w-full py-4 rounded-2xl text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed mx-auto flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.3)] !from-red-500 !to-red-600 before:!from-red-400 before:!to-red-500"
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

function NotConnected({ connectors, connect, isPending }) {
  const metaMask = connectors.find((c) => c.name === "MetaMask");

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 animate-slide-up">
      <div className="relative w-full max-w-2xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan/20 via-cyber-purple/20 to-cyber-pink/20 blur-3xl -z-10 rounded-[100px]"></div>
        
        <div className="glass-panel rounded-3xl p-10 md:p-16 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-cyber-cyan to-cyber-purple flex items-center justify-center shadow-[0_0_40px_rgba(0,229,255,0.4)] animate-pulse-glow">
            <svg className="w-12 h-12 text-midnight" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6 tracking-tight">
            Lending, <br /> Unlocked on Arc
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-lg mx-auto font-medium leading-relaxed">
            Supply assets, earn yield, and borrow against collateral instantly with zero slippage.
          </p>

          {metaMask ? (
            <button
              onClick={() => connect({ connector: metaMask })}
              disabled={isPending}
              className="btn-primary w-full md:w-auto px-10 py-5 rounded-2xl text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed mx-auto flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,229,255,0.3)] hover:shadow-[0_0_40px_rgba(0,229,255,0.5)]"
            >
              {isPending ? (
                <>
                  <svg className="w-6 h-6 animate-spin text-midnight" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Initializing Core...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                  Connect Wallet to Enter
                </>
              )}
            </button>
          ) : (
            <div className="inline-block px-8 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold shadow-[0_0_20px_rgba(239,68,68,0.15)]">
              ⚠️ MetaMask extension not detected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
