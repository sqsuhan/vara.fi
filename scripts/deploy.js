const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  // ── 1. Deploy MockCollateralToken (MCOL, 18 dec) ──────────────────────────
  console.log("\n[1/4] Deploying MockCollateralToken...");
  const MockCollateralToken = await ethers.getContractFactory("MockCollateralToken");
  const mcol = await MockCollateralToken.deploy();
  await mcol.waitForDeployment();
  const mcolAddress = await mcol.getAddress();
  console.log("MockCollateralToken deployed to:", mcolAddress);

  // ── 2. Deploy MockPriceOracle ─────────────────────────────────────────────
  console.log("\n[2/4] Deploying MockPriceOracle...");
  const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
  const oracle = await MockPriceOracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("MockPriceOracle deployed to:", oracleAddress);

  // ── 3. Deploy MockUSDC (6 dec, matching real USDC) ────────────────────────
  console.log("\n[3/4] Deploying MockUSDC (6 decimals)...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // ── 4. Deploy LendingPool ─────────────────────────────────────────────────
  console.log("\n[4/4] Deploying LendingPool...");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await LendingPool.deploy(mcolAddress, usdcAddress, oracleAddress);
  await lendingPool.waitForDeployment();
  const poolAddress = await lendingPool.getAddress();
  console.log("LendingPool deployed to:", poolAddress);

  // ── Seed the pool with USDC liquidity (100,000 USDC, 6 dec) ──────────────
  console.log("\nSeeding LendingPool with 100,000 USDC liquidity...");
  const seedAmount = ethers.parseUnits("100000", 6);
  const approveTx = await usdc.approve(poolAddress, seedAmount);
  await approveTx.wait();
  const seedTx = await lendingPool.seedLiquidity(seedAmount);
  await seedTx.wait();
  console.log("Pool seeded with 100,000 USDC.");

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("                  DEPLOYMENT SUMMARY");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("Network:               Arc Testnet (chainId 5042002)");
  console.log("MockCollateralToken:  ", mcolAddress);
  console.log("MockPriceOracle:      ", oracleAddress);
  console.log("MockUSDC:             ", usdcAddress);
  console.log("LendingPool:          ", poolAddress);
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\nUpdate your frontend/.env accordingly.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
