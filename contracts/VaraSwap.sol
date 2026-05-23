// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20Decimals is IERC20 {
    function decimals() external view returns (uint8);
}

contract VaraSwap is Ownable {
    using SafeERC20 for IERC20;

    // tokenIn => tokenOut => rate (1e18 = 1:1)
    mapping(address => mapping(address => uint256)) public exchangeRates;

    event Swapped(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event RateSet(address indexed tokenIn, address indexed tokenOut, uint256 rate);

    constructor() Ownable(msg.sender) {}

    function setRate(address tokenIn, address tokenOut, uint256 rate) external onlyOwner {
        exchangeRates[tokenIn][tokenOut] = rate;
        emit RateSet(tokenIn, tokenOut, rate);
    }

    function getRate(address tokenIn, address tokenOut) public view returns (uint256) {
        return exchangeRates[tokenIn][tokenOut];
    }

    function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) public view returns (uint256) {
        uint256 rate = exchangeRates[tokenIn][tokenOut];
        require(rate > 0, "VaraSwap: Unsupported pair");

        uint8 decimalsIn = IERC20Decimals(tokenIn).decimals();
        uint8 decimalsOut = IERC20Decimals(tokenOut).decimals();

        // Normalize amountIn to 18 decimals
        uint256 standardIn;
        if (decimalsIn < 18) {
            standardIn = amountIn * (10 ** (18 - decimalsIn));
        } else if (decimalsIn > 18) {
            standardIn = amountIn / (10 ** (decimalsIn - 18));
        } else {
            standardIn = amountIn;
        }

        // Apply rate (rate is scaled by 1e18)
        uint256 standardOut = (standardIn * rate) / 1e18;

        // Scale down to decimalsOut
        uint256 amountOut;
        if (decimalsOut < 18) {
            amountOut = standardOut / (10 ** (18 - decimalsOut));
        } else if (decimalsOut > 18) {
            amountOut = standardOut * (10 ** (decimalsOut - 18));
        } else {
            amountOut = standardOut;
        }

        return amountOut;
    }

    function swap(address tokenIn, address tokenOut, uint256 amountIn) external {
        uint256 amountOut = getAmountOut(tokenIn, tokenOut, amountIn);
        require(amountOut > 0, "VaraSwap: Insufficient output amount");

        // Transfer tokenIn from user
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Transfer tokenOut to user
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);

        emit Swapped(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }
}
