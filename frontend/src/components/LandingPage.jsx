import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import '../styles/landing.css';

const LandingPage = ({ onLaunchApp }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Parallax and perspective transformations
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);
  
  const bentoY = useTransform(scrollYProgress, [0.1, 0.4], [200, 0]);
  const bentoOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
  const bentoRotateX = useTransform(scrollYProgress, [0.1, 0.4], [20, 0]);

  return (
    <div 
      ref={containerRef} 
      className="bg-[#f4f7f9] min-h-[300vh] text-[#1a1a24] font-sans selection:bg-blue-500/30 overflow-x-hidden landing-scroll relative"
    >
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center backdrop-blur-md bg-white/40 border-b border-white/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
             <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">Vara.fi</span>
        </div>
        <button 
          onClick={onLaunchApp}
          className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
        >
          Launch App
        </button>
      </nav>

      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-400/20 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-20%] w-[60vw] h-[60vw] bg-purple-400/10 rounded-full blur-[150px]" />
      </div>

      {/* Hero Section */}
      <motion.div 
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
        className="h-screen flex flex-col items-center justify-center relative px-4 pt-20"
      >
        {/* Floating Abstract Elements */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none perspective-1000">
          <div className="relative w-full max-w-5xl h-[60vh]">
            <motion.div 
              className="absolute left-[10%] top-[20%] w-32 h-32 rounded-full glass-card flex items-center justify-center float-animation"
              style={{ transform: 'rotateY(20deg) rotateX(10deg)' }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-300 opacity-80" />
            </motion.div>
            
            <motion.div 
              className="absolute right-[15%] top-[10%] w-40 h-40 rounded-full glass-card flex items-center justify-center float-animation-delayed"
              style={{ transform: 'rotateY(-15deg) rotateX(20deg)' }}
            >
               <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-400 opacity-80" />
            </motion.div>

            <motion.div 
              className="absolute left-[20%] bottom-[10%] w-24 h-24 rounded-full glass-card flex items-center justify-center float-animation"
              style={{ transform: 'rotateY(30deg) rotateX(-10deg)', animationDuration: '5s' }}
            >
              <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
          </div>
        </div>

        <h1 className="text-6xl md:text-8xl font-black text-center tracking-tighter mb-6 z-10">
          <span className="gradient-text block">The future of</span>
          <span className="gradient-text block">DeFi is here</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 font-medium mb-10 max-w-lg text-center z-10">
          Experience seamless lending and borrowing on the Arc Network. Built for speed, designed for everyone.
        </p>
        
        <div className="z-10 bg-white p-2 rounded-full shadow-xl flex items-center gap-2 border border-gray-100">
          <input 
            type="email" 
            placeholder="Enter email for updates" 
            className="px-6 py-3 bg-transparent outline-none w-64 text-sm font-medium"
          />
          <button onClick={onLaunchApp} className="bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors">
            Launch App
          </button>
        </div>
      </motion.div>

      {/* Bento Grid Features Section */}
      <div className="min-h-screen relative z-20 px-4 md:px-8 py-20 perspective-1000">
        <motion.div 
          style={{ y: bentoY, opacity: bentoOpacity, rotateX: bentoRotateX }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Next-gen crypto lending</h2>
            <p className="text-gray-500 max-w-2xl mx-auto font-medium">
              We address the challenges of traditional finance by providing a robust, non-custodial protocol with deep liquidity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Feature Card */}
            <div className="md:col-span-2 glass-card rounded-3xl p-10 flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute right-[-10%] top-[-20%] w-[60%] h-[120%] bg-blue-500/10 blur-[50px] group-hover:bg-blue-500/20 transition-colors duration-500" />
              
              <div className="relative z-10 mb-20">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold mb-4">Evolving beyond traditional systems</h3>
                <p className="text-gray-500 max-w-md">
                  Vara.fi empowers users to supply assets and earn dynamic yield, or borrow instantly against their collateral.
                </p>
              </div>

              {/* Decorative inner elements mimicking the video */}
              <div className="absolute bottom-[-10%] right-[10%] w-48 h-48 bg-white rounded-full shadow-2xl flex items-center justify-center float-animation transform group-hover:scale-105 transition-transform">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 opacity-90" />
              </div>
              <div className="absolute bottom-[10%] right-[30%] w-32 h-32 bg-gray-900 rounded-full shadow-2xl flex items-center justify-center float-animation-delayed transform group-hover:scale-105 transition-transform">
                 <div className="w-16 h-16 rounded-full border-4 border-white/20" />
              </div>
            </div>

            {/* Secondary Feature Card 1 */}
            <div className="glass-card rounded-3xl p-8 flex flex-col justify-between group">
               <div>
                  <h4 className="text-xl font-bold mb-3">Our Mission</h4>
                  <p className="text-gray-500 text-sm">
                    To equip users with innovative technology to stay ahead in decentralized finance.
                  </p>
               </div>
               <div className="mt-8 flex justify-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-500 flex items-center justify-center">
                     <span className="text-white font-bold text-xl">Vara</span>
                  </div>
               </div>
            </div>

            {/* Secondary Feature Card 2 */}
            <div className="glass-card rounded-3xl p-8 flex flex-col justify-center items-center text-center bg-blue-600 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
              <div className="relative z-10">
                <h4 className="text-2xl font-bold mb-4">Join the waitlist</h4>
                <p className="text-blue-100 text-sm mb-6">Embrace the next generation of DeFi.</p>
                <button onClick={onLaunchApp} className="bg-white text-blue-600 px-6 py-2.5 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-shadow">
                  Launch App Now
                </button>
              </div>
            </div>

            {/* Secondary Feature Card 3 */}
            <div className="md:col-span-2 glass-card rounded-3xl p-8 group">
              <h4 className="text-2xl font-bold mb-3">Disrupting the status quo</h4>
              <p className="text-gray-500 max-w-xl">
                We are building the foundational liquidity layer for the Arc ecosystem. 
                Experience transparent, secure, and efficient capital markets.
              </p>
              <div className="mt-8 h-32 w-full bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Blue CTA Section like in the video */}
      <div className="min-h-screen relative z-30 bg-blue-600 rounded-t-[50px] md:rounded-t-[100px] flex flex-col items-center justify-center overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-blue-500 to-blue-700" />
         
         {/* Decorative circles */}
         <div className="absolute top-[20%] left-[10%] w-64 h-64 border border-white/20 rounded-full" />
         <div className="absolute top-[10%] right-[15%] w-96 h-96 border border-white/10 rounded-full" />
         <div className="absolute bottom-[-10%] left-[30%] w-full max-w-3xl h-[400px] bg-blue-500/50 rounded-[100%] blur-3xl" />

         <div className="relative z-10 text-center px-4 max-w-3xl">
            <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
              Unlock the future of finance
            </h2>
            <p className="text-xl text-blue-100 mb-12 max-w-xl mx-auto">
              Join thousands of users who are already experiencing the power of decentralized lending on Vara.fi.
            </p>
            
            <button 
              onClick={onLaunchApp}
              className="bg-white text-blue-600 px-10 py-4 rounded-full text-lg font-bold shadow-2xl hover:scale-105 transition-transform duration-300 flex items-center gap-2 mx-auto"
            >
              Launch App
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
         </div>
      </div>
    </div>
  );
};

export default LandingPage;
