// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockEUR
/// @notice Mock Euro token for testing swaps.
contract MockEUR is ERC20 {
    mapping(address => uint256) public lastFaucetUse;
    uint256 public constant FAUCET_COOLDOWN = 1 days;
    uint256 public constant FAUCET_AMOUNT = 100 * 10**18;

    constructor() ERC20("Mock Euro", "EUR") {
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function faucet() external {
        require(block.timestamp >= lastFaucetUse[msg.sender] + FAUCET_COOLDOWN, "MockEUR: cooldown not finished");
        lastFaucetUse[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
    }
}
