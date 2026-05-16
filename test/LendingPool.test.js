const { expect } = require("chai");
const { ethers, BigInt } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const MaxUint256 = ethers.MaxUint256;

describe("LendingPool", function () {
  let owner, alice, bob;
  let mcol, oracle, usdc, pool;

  // MCOL = 18 dec, USDC = 6 dec (matches real USDC)
  const parseCol  = (n) => ethers.parseUnits(String(n), 18);
  const parseUsdc = (n) => ethers.parseUnits(String(n), 6);
  const formatUsdc = (n) => ethers.formatUnits(n, 6);
  const ONE_E18 = ethers.parseUnits("1", 18);

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();

    const MCOLFactory  = await ethers.getContractFactory("MockCollateralToken");
    const OracleFactory = await ethers.getContractFactory("MockPriceOracle");
    const USDCFactory  = await ethers.getContractFactory("MockUSDC");
    const PoolFactory  = await ethers.getContractFactory("LendingPool");

    mcol   = await MCOLFactory.deploy();
    oracle = await OracleFactory.deploy();
    usdc   = await USDCFactory.deploy();

    pool = await PoolFactory.deploy(
      await mcol.getAddress(),
      await usdc.getAddress(),
      await oracle.getAddress()
    );

    // Seed pool with 500,000 USDC
    const seedAmount = parseUsdc("500000");
    await usdc.approve(await pool.getAddress(), seedAmount);
    await pool.seedLiquidity(seedAmount);

    // Mint MCOL to alice
    await mcol.mint(alice.address, parseCol("10000"));
  });

  // ─── Deposit ──────────────────────────────────────────────────────────────
  describe("deposit()", () => {
    it("should deposit MCOL and update position", async () => {
      await mcol.connect(alice).approve(await pool.getAddress(), parseCol("1000"));
      await pool.connect(alice).deposit(parseCol("1000"));

      const pos = await pool.getPosition(alice.address);
      expect(pos.collateral).to.equal(parseCol("1000"));
    });

    it("should revert if amount is zero", async () => {
      await expect(pool.connect(alice).deposit(0)).to.be.revertedWith(
        "LendingPool: amount must be > 0"
      );
    });
  });

  // ─── Borrow ───────────────────────────────────────────────────────────────
  describe("borrow()", () => {
    beforeEach(async () => {
      await mcol.connect(alice).approve(await pool.getAddress(), parseCol("1000"));
      await pool.connect(alice).deposit(parseCol("1000"));
    });

    it("should borrow up to 70% LTV", async () => {
      // 1000 MCOL * $2 = $2000 USD → max borrow = $1400 USDC (6 dec)
      const pos = await pool.getPosition(alice.address);
      expect(pos.maxBorrow).to.equal(parseUsdc("1400"));

      await pool.connect(alice).borrow(parseUsdc("1000"));
      const posAfter = await pool.getPosition(alice.address);
      expect(posAfter.borrowed).to.equal(parseUsdc("1000"));
    });

    it("should revert if borrow exceeds LTV", async () => {
      await expect(
        pool.connect(alice).borrow(parseUsdc("1401"))
      ).to.be.revertedWith("LendingPool: exceeds max borrow");
    });

    it("should revert if existing loan is active", async () => {
      await pool.connect(alice).borrow(parseUsdc("500"));
      await expect(
        pool.connect(alice).borrow(parseUsdc("100"))
      ).to.be.revertedWith("LendingPool: repay existing loan first");
    });
  });

  // ─── Repay ────────────────────────────────────────────────────────────────
  describe("repay()", () => {
    beforeEach(async () => {
      await mcol.connect(alice).approve(await pool.getAddress(), parseCol("1000"));
      await pool.connect(alice).deposit(parseCol("1000"));
      await pool.connect(alice).borrow(parseUsdc("1000"));
    });

    it("should repay loan and clear position", async () => {
      // fast-forward 1 year
      await time.increase(365 * 24 * 3600);

      // Mint a generous amount and approve max to avoid timing-rounding issues
      await usdc.mint(alice.address, parseUsdc("2000"));
      await usdc.connect(alice).approve(await pool.getAddress(), ethers.MaxUint256);

      await pool.connect(alice).repay();

      const posAfter = await pool.getPosition(alice.address);
      expect(posAfter.borrowed).to.equal(0n);
    });

    it("should accrue ~5% interest after 1 year", async () => {
      await time.increase(365 * 24 * 3600);
      const pos = await pool.getPosition(alice.address);
      // 5% of 1000 USDC = 50 USDC
      const interestFloat = parseFloat(formatUsdc(pos.interest));
      expect(interestFloat).to.be.closeTo(50, 0.01);
    });
  });

  // ─── Withdraw ─────────────────────────────────────────────────────────────
  describe("withdraw()", () => {
    beforeEach(async () => {
      await mcol.connect(alice).approve(await pool.getAddress(), parseCol("1000"));
      await pool.connect(alice).deposit(parseCol("1000"));
    });

    it("should withdraw collateral when no loan", async () => {
      await pool.connect(alice).withdraw(parseCol("500"));
      const pos = await pool.getPosition(alice.address);
      expect(pos.collateral).to.equal(parseCol("500"));
    });

    it("should revert if active loan exists", async () => {
      await pool.connect(alice).borrow(parseUsdc("500"));
      await expect(
        pool.connect(alice).withdraw(parseCol("100"))
      ).to.be.revertedWith("LendingPool: repay loan before withdrawing");
    });
  });

  // ─── Liquidate ────────────────────────────────────────────────────────────
  describe("liquidate()", () => {
    it("should liquidate under-collateralised position", async () => {
      await mcol.connect(alice).approve(await pool.getAddress(), parseCol("1000"));
      await pool.connect(alice).deposit(parseCol("1000"));
      // Borrow at max LTV: 1000 MCOL * $2 * 70% = $1400 USDC
      await pool.connect(alice).borrow(parseUsdc("1400"));

      // Drop price to $1 → collateral value = $1000, debt = $1400 → unhealthy
      await oracle.setPrice(ethers.parseUnits("1", 18));

      // Bob liquidates
      await usdc.mint(bob.address, parseUsdc("2000"));
      await usdc.connect(bob).approve(await pool.getAddress(), parseUsdc("2000"));

      await pool.connect(bob).liquidate(alice.address);

      const posAfter = await pool.getPosition(alice.address);
      expect(posAfter.borrowed).to.equal(0n);
      expect(posAfter.collateral).to.equal(0n);
    });

    it("should revert when position is healthy", async () => {
      await mcol.connect(alice).approve(await pool.getAddress(), parseCol("1000"));
      await pool.connect(alice).deposit(parseCol("1000"));
      await pool.connect(alice).borrow(parseUsdc("500"));

      await expect(
        pool.connect(bob).liquidate(alice.address)
      ).to.be.revertedWith("LendingPool: position is healthy");
    });
  });

  // ─── getPosition ──────────────────────────────────────────────────────────
  describe("getPosition()", () => {
    it("should return all zeroes for a fresh address", async () => {
      const pos = await pool.getPosition(bob.address);
      expect(pos.collateral).to.equal(0n);
      expect(pos.borrowed).to.equal(0n);
      expect(pos.interest).to.equal(0n);
    });

    it("health factor should be max when no debt", async () => {
      await mcol.connect(alice).approve(await pool.getAddress(), parseCol("1000"));
      await pool.connect(alice).deposit(parseCol("1000"));
      const pos = await pool.getPosition(alice.address);
      expect(pos.healthFactor).to.equal(ethers.MaxUint256);
    });
  });
});
