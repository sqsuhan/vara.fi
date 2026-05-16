// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IPriceOracle {
    function getPrice() external view returns (uint256);
}

/**
 * @title LendingPool
 * @notice Vara.fi — The Open Liquidity Market on Arc
 * @dev Users deposit MCOL as collateral and borrow USDC.
 *      LTV = 70%, liquidation threshold = 80%, interest = 5% annual simple.
 */
contract LendingPool is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ─── Constants ───────────────────────────────────────────────────────────
    uint256 public constant LTV_FACTOR          = 70;   // 70%
    uint256 public constant LIQ_THRESHOLD       = 80;   // 80%
    uint256 public constant INTEREST_RATE_BPS   = 500;  // 5% annual (basis points)
    uint256 public constant SECONDS_PER_YEAR    = 365 days;
    uint256 public constant PRECISION           = 1e18;

    // ─── State ────────────────────────────────────────────────────────────────
    IERC20 public immutable collateralToken; // MCOL (18 decimals)
    IERC20 public immutable borrowToken;     // USDC (6 decimals)
    IPriceOracle public immutable oracle;

    struct UserPosition {
        uint256 collateralAmount;   // MCOL deposited (18 decimals)
        uint256 borrowedAmount;     // USDC borrowed  (6 decimals)
        uint256 borrowTimestamp;    // when borrow started
    }

    mapping(address => UserPosition) public positions;

    // ─── Events ───────────────────────────────────────────────────────────────
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 principal, uint256 interest);
    event Liquidated(address indexed liquidator, address indexed user, uint256 collateralSeized);

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(
        address _collateralToken,
        address _borrowToken,
        address _oracle
    ) Ownable(msg.sender) {
        collateralToken = IERC20(_collateralToken);
        borrowToken     = IERC20(_borrowToken);
        oracle          = IPriceOracle(_oracle);
    }

    // ─── Public functions ─────────────────────────────────────────────────────

    /**
     * @notice Deposit MCOL as collateral.
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "LendingPool: amount must be > 0");
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);
        positions[msg.sender].collateralAmount += amount;
        emit Deposited(msg.sender, amount);
    }

    /**
     * @notice Borrow USDC up to 70% LTV of collateral value.
     * @param amount USDC amount to borrow (6 decimals).
     */
    function borrow(uint256 amount) external nonReentrant {
        require(amount > 0, "LendingPool: amount must be > 0");
        UserPosition storage pos = positions[msg.sender];
        require(pos.borrowedAmount == 0, "LendingPool: repay existing loan first");

        uint256 maxBorrow = _maxBorrow(pos.collateralAmount);
        require(amount <= maxBorrow, "LendingPool: exceeds max borrow");
        require(borrowToken.balanceOf(address(this)) >= amount, "LendingPool: insufficient liquidity");

        pos.borrowedAmount   = amount;
        pos.borrowTimestamp  = block.timestamp;

        borrowToken.safeTransfer(msg.sender, amount);
        emit Borrowed(msg.sender, amount);
    }

    /**
     * @notice Repay the full borrowed amount plus accrued simple interest.
     */
    function repay() external nonReentrant {
        UserPosition storage pos = positions[msg.sender];
        require(pos.borrowedAmount > 0, "LendingPool: no active loan");

        uint256 interest  = _accruedInterest(pos.borrowedAmount, pos.borrowTimestamp);
        uint256 principal = pos.borrowedAmount;
        uint256 totalDue  = principal + interest;

        pos.borrowedAmount  = 0;
        pos.borrowTimestamp = 0;

        borrowToken.safeTransferFrom(msg.sender, address(this), totalDue);
        emit Repaid(msg.sender, principal, interest);
    }

    /**
     * @notice Withdraw MCOL collateral. Only allowed when no active loan.
     * @param amount MCOL amount to withdraw (18 decimals).
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "LendingPool: amount must be > 0");
        UserPosition storage pos = positions[msg.sender];
        require(pos.borrowedAmount == 0, "LendingPool: repay loan before withdrawing");
        require(pos.collateralAmount >= amount, "LendingPool: insufficient collateral");

        pos.collateralAmount -= amount;
        collateralToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Liquidate a position whose health factor < 1.
     *         Liquidator repays the debt and receives the collateral.
     * @param user Address of the under-collateralised borrower.
     */
    function liquidate(address user) external nonReentrant {
        UserPosition storage pos = positions[user];
        require(pos.borrowedAmount > 0, "LendingPool: no active loan");

        (,,,, uint256 healthFactor) = getPosition(user);
        require(healthFactor < PRECISION, "LendingPool: position is healthy");

        uint256 interest = _accruedInterest(pos.borrowedAmount, pos.borrowTimestamp);
        uint256 totalDue = pos.borrowedAmount + interest;

        uint256 collateralSeized = pos.collateralAmount;

        pos.borrowedAmount   = 0;
        pos.borrowTimestamp  = 0;
        pos.collateralAmount = 0;

        borrowToken.safeTransferFrom(msg.sender, address(this), totalDue);
        collateralToken.safeTransfer(msg.sender, collateralSeized);

        emit Liquidated(msg.sender, user, collateralSeized);
    }

    /**
     * @notice Returns a snapshot of a user's position.
     * @return collateral     MCOL deposited (18 decimals)
     * @return borrowed       USDC borrowed  (6 decimals)
     * @return interest       Accrued interest in USDC (6 decimals)
     * @return maxBorrow      Maximum USDC borrowable (6 decimals)
     * @return healthFactor   Health factor scaled by 1e18 (1e18 = 1.0)
     */
    function getPosition(address user)
        public
        view
        returns (
            uint256 collateral,
            uint256 borrowed,
            uint256 interest,
            uint256 maxBorrow,
            uint256 healthFactor
        )
    {
        UserPosition storage pos = positions[user];
        collateral  = pos.collateralAmount;
        borrowed    = pos.borrowedAmount;
        interest    = borrowed > 0 ? _accruedInterest(borrowed, pos.borrowTimestamp) : 0;
        maxBorrow   = _maxBorrow(collateral);
        healthFactor = _healthFactor(collateral, borrowed + interest);
    }

    // ─── Owner utilities ──────────────────────────────────────────────────────

    /**
     * @notice Seed the pool with USDC liquidity.
     */
    function seedLiquidity(uint256 amount) external onlyOwner {
        borrowToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    /**
     * @dev Maximum USDC borrowable given collateral amount.
     *      collateralUSD = collateralAmount * price / 1e18   (price has 18 dec, col has 18 dec → result in USD 18 dec)
     *      maxBorrowUSD  = collateralUSD * 70 / 100          (USD 18 dec)
     *      maxBorrowUSDC = maxBorrowUSD / 1e12               (scale from 18 dec → 6 dec)
     */
    function _maxBorrow(uint256 collateralAmount) internal view returns (uint256) {
        uint256 price          = oracle.getPrice();                     // 18 decimals
        uint256 collateralUSD  = (collateralAmount * price) / PRECISION; // 18 dec → 18 dec USD
        uint256 maxBorrowUSD   = (collateralUSD * LTV_FACTOR) / 100;
        return maxBorrowUSD / 1e12; // convert to 6-decimal USDC
    }

    /**
     * @dev Health factor = (collateralUSD * liquidationThreshold / 100) / totalDebtUSDC
     *      Both numerator and denominator normalised to 6-decimal USDC.
     *      Result scaled by 1e18.
     */
    function _healthFactor(uint256 collateralAmount, uint256 totalDebtUSDC) internal view returns (uint256) {
        if (totalDebtUSDC == 0) return type(uint256).max;
        uint256 price         = oracle.getPrice();
        uint256 collateralUSD = (collateralAmount * price) / PRECISION; // 18 dec USD
        uint256 liquidationValue = (collateralUSD * LIQ_THRESHOLD) / 100; // 18 dec USD
        uint256 liqValueUSDC  = liquidationValue / 1e12; // 6 dec USDC
        return (liqValueUSDC * PRECISION) / totalDebtUSDC;
    }

    /**
     * @dev Simple annual interest: interest = principal * rate * elapsed / year / 10000
     *      Result in USDC (6 decimals).
     */
    function _accruedInterest(uint256 principal, uint256 borrowTimestamp) internal view returns (uint256) {
        if (borrowTimestamp == 0) return 0;
        uint256 elapsed = block.timestamp - borrowTimestamp;
        return (principal * INTEREST_RATE_BPS * elapsed) / (SECONDS_PER_YEAR * 10_000);
    }
}
