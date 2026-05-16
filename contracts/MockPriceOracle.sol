// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MockPriceOracle is Ownable {
    uint256 private _price;

    event PriceUpdated(uint256 newPrice);

    constructor() Ownable(msg.sender) {
        _price = 2e18; // 1 MCOL = $2.00 (18 decimals)
    }

    function getPrice() external view returns (uint256) {
        return _price;
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        _price = newPrice;
        emit PriceUpdated(newPrice);
    }
}
