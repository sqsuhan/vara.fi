const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Constants
  const USDC_NATIVE = "0x3600000000000000000000000000000000000000";
  const CIRBTC = "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF";

  // ── 1. Deploy MockCollateralToken (MCOL, 18 dec) ──────────────────────────
  console.log("\n[1/6] Deploying MockCollateralToken...");
  const MockCollateralToken = await ethers.getContractFactory("MockCollateralToken");
  const mcol = await MockCollateralToken.deploy();
  await mcol.waitForDeployment();
  const mcolAddress = await mcol.getAddress();
  console.log("MockCollateralToken deployed to:", mcolAddress);

  // ── 2. Deploy MockPriceOracle ─────────────────────────────────────────────
  console.log("\n[2/6] Deploying MockPriceOracle...");
  const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
  const oracle = await MockPriceOracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("MockPriceOracle deployed to:", oracleAddress);

  // ── 3. Deploy VaUSDC (6 dec, matching real USDC) ────────────────────────
  console.log("\n[3/6] Deploying VaUSDC (6 decimals)...");
  const VaUSDC = await ethers.getContractFactory("VaUSDC");
  const usdc = await VaUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("VaUSDC deployed to:", usdcAddress);

  // ── 4. Deploy LendingPool ─────────────────────────────────────────────────
  console.log("\n[4/6] Deploying LendingPool...");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy(mcolAddress, usdcAddress, oracleAddress);
  await lendingPool.waitForDeployment();
  const poolAddress = await lendingPool.getAddress();
  console.log("LendingPool deployed to:", poolAddress);

  // Seed LendingPool with VaUSDC
  console.log("Seeding LendingPool with 100,000 VaUSDC...");
  const poolSeedAmount = ethers.parseUnits("100000", 6);
  await (await usdc.approve(poolAddress, poolSeedAmount)).wait();
  await (await lendingPool.seedLiquidity(poolSeedAmount)).wait();

  // ── 5. Deploy MockEUR ─────────────────────────────────────────────────────
  console.log("\n[5/6] Deploying MockEUR...");
  const MockEUR = await ethers.getContractFactory("MockEUR");
  const eur = await MockEUR.deploy();
  await eur.waitForDeployment();
  const eurAddress = await eur.getAddress();
  console.log("MockEUR deployed to:", eurAddress);

  // ── 6. Deploy VaraSwap ────────────────────────────────────────────────────
  console.log("\n[6/6] Deploying VaraSwap...");
  const VaraSwap = await ethers.getContractFactory("VaraSwap");
  const swap = await VaraSwap.deploy();
  await swap.waitForDeployment();
  const swapAddress = await swap.getAddress();
  console.log("VaraSwap deployed to:", swapAddress);

  // Set Rates
  console.log("Setting exchange rates in VaraSwap...");
  await (await swap.setRate(eurAddress, USDC_NATIVE, ethers.parseUnits("1.08", 18))).wait();
  await (await swap.setRate(CIRBTC, USDC_NATIVE, ethers.parseUnits("95000", 18))).wait();
  await (await swap.setRate(USDC_NATIVE, usdcAddress, ethers.parseUnits("1", 18))).wait();
  await (await swap.setRate(usdcAddress, USDC_NATIVE, ethers.parseUnits("1", 18))).wait();
  await (await swap.setRate(eurAddress, usdcAddress, ethers.parseUnits("1.08", 18))).wait();
  await (await swap.setRate(CIRBTC, usdcAddress, ethers.parseUnits("95000", 18))).wait();

  // Seed VaraSwap Liquidity
  console.log("Seeding VaraSwap with liquidity...");
  try {
    const swapSeedVaUSDC = ethers.parseUnits("50000", 6);
    await (await usdc.transfer(swapAddress, swapSeedVaUSDC)).wait();
    console.log("Seeded 50,000 VaUSDC to VaraSwap.");
  } catch (e) {
    console.log("Failed to seed VaUSDC:", e.message);
  }

  // To seed external tokens, we try transferring from deployer. 
  // If the deployer doesn't have them, it will throw an error, which we catch.
  const ierc20Abi = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)"
  ];
  
  const usdcNativeContract = new ethers.Contract(USDC_NATIVE, ierc20Abi, deployer);
  try {
    const bal = await usdcNativeContract.balanceOf(deployer.address);
    if (bal >= ethers.parseUnits("50000", 6)) {
      await (await usdcNativeContract.transfer(swapAddress, ethers.parseUnits("50000", 6))).wait();
      console.log("Seeded 50,000 USDC Native to VaraSwap.");
    } else {
      console.log("Not enough USDC Native balance to seed.");
    }
  } catch (e) {
    console.log("Failed to seed USDC Native:", e.message);
  }

  const cirbtcContract = new ethers.Contract(CIRBTC, ierc20Abi, deployer);
  try {
    const bal = await cirbtcContract.balanceOf(deployer.address);
    if (bal >= ethers.parseUnits("100", 18)) {
      await (await cirbtcContract.transfer(swapAddress, ethers.parseUnits("100", 18))).wait();
      console.log("Seeded 100 cirBTC to VaraSwap.");
    } else {
      console.log("Not enough cirBTC balance to seed.");
    }
  } catch (e) {
    console.log("Failed to seed cirBTC:", e.message);
  }

  // ── Summary & Output ──────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("                  DEPLOYMENT SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("MockCollateralToken:  ", mcolAddress);
  console.log("MockPriceOracle:      ", oracleAddress);
  console.log("VaUSDC:               ", usdcAddress);
  console.log("LendingPool:          ", poolAddress);
  console.log("MockEUR:              ", eurAddress);
  console.log("VaraSwap:             ", swapAddress);
  console.log("═══════════════════════════════════════════════════════════");

  const deployedJson = {
    MockCollateralToken: mcolAddress,
    MockPriceOracle: oracleAddress,
    VaUSDC: usdcAddress,
    LendingPool: poolAddress,
    MockEUR: eurAddress,
    VaraSwap: swapAddress
  };

  fs.writeFileSync(path.join(__dirname, "../deployed.json"), JSON.stringify(deployedJson, null, 2));
  console.log("\nAddresses saved to deployed.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
