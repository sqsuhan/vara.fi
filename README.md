# Vara.fi — The Open Liquidity Market on Arc

A full-stack DeFi lending protocol built on the **Arc Testnet**. Deposit MCOL as collateral, borrow USDC, repay with interest, and manage your positions — all on-chain.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.24 · Hardhat · OpenZeppelin v5 |
| Frontend | React 18 · Vite · Tailwind CSS |
| Web3 | Wagmi v2 · RainbowKit v2 · viem · ethers.js v6 |
| Testing | Hardhat + Chai + hardhat-network-helpers |

---

## Project Structure

```
vara-fi/
├── contracts/
│   ├── MockCollateralToken.sol   # ERC20 collateral token (MCOL)
│   ├── MockPriceOracle.sol       # Price oracle (1 MCOL = $2)
│   └── LendingPool.sol           # Core lending protocol
├── scripts/
│   └── deploy.js                 # Deployment script
├── test/
│   └── LendingPool.test.js       # Full test suite
├── hardhat.config.js
├── .env.example
└── frontend/
    └── src/
        ├── abi/                  # Contract ABIs
        ├── components/           # React UI panels
        ├── wagmi.js              # Chain + Wagmi config
        ├── App.jsx               # Root app component
        ├── main.jsx              # Entry point with providers
        └── index.css             # Tailwind + global styles
```

---

## Protocol Parameters

| Parameter | Value |
|---|---|
| Loan-to-Value (LTV) | 70% |
| Liquidation Threshold | 80% |
| Annual Interest Rate | 5% (simple) |
| Collateral Token | MCOL (Mock Collateral, 18 dec) |
| Borrow Token | USDC (18 dec on testnet) |

---

## Arc Testnet Details

| Field | Value |
|---|---|
| Network Name | Arc Testnet |
| RPC URL | https://rpc.testnet.arc.network |
| Chain ID | 5042002 |
| Native Currency | USDC |
| Block Explorer | https://testnet.arcscan.app |

---

## Local Setup

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- A wallet with Arc Testnet funds

### 1. Clone & install

```bash
git clone <repo-url>
cd vara-fi

# Install contract dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Configure environment

```bash
# Root .env (for deployment)
cp .env.example .env
# Fill in PRIVATE_KEY with your deployer wallet key

# Frontend .env
cp frontend/.env.example frontend/.env
# Fill in VITE_WALLETCONNECT_PROJECT_ID
```

### 3. Compile contracts

```bash
npm run compile
```

### 4. Run tests

```bash
npm test
```

### 5. Deploy to Arc Testnet

```bash
npm run deploy:arc
```

After deployment, copy the contract addresses from the output into `frontend/.env`.

### 6. Start the frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Deployed Contract Addresses

> Fill these in after running the deploy script on Arc Testnet.

| Contract | Address |
|---|---|
| MockCollateralToken (MCOL) | _TBD_ |
| MockPriceOracle | _TBD_ |
| MockUSDC | _TBD_ |
| LendingPool | _TBD_ |

---

## How It Works

1. **Deposit** — Approve and deposit MCOL tokens as collateral into the LendingPool.
2. **Borrow** — Borrow USDC up to 70% of your collateral's USD value (oracle-priced).
3. **Repay** — Approve and repay your full principal + 5% annual simple interest.
4. **Withdraw** — Once your loan is repaid, withdraw your MCOL collateral.
5. **Liquidate** — Anyone can liquidate positions with a health factor below 1.0.

**Health Factor** = (Collateral × Liquidation Threshold) / (Debt + Interest)

When health factor < 1.0, the position is eligible for liquidation.

---

## License

MIT
