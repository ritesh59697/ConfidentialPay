// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    mapping(address holder => mapping(address operator => uint48 until)) private _operators;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function setOperator(address operator, uint48 until) external {
        _operators[msg.sender][operator] = until;
    }

    function isOperator(address holder, address operator) external view returns (bool) {
        return uint256(_operators[holder][operator]) >= block.timestamp;
    }

    function confidentialTransferFrom(
        address from,
        address /* to */,
        bytes32 encAmount
    ) external view returns (bytes32) {
        require(uint256(_operators[from][msg.sender]) >= block.timestamp, "Operator not set");
        return encAmount;
    }
}
