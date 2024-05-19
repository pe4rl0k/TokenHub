pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CustomToken is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }
}

contract TokenFactory {
    address[] public deployedTokens;

    event TokenCreated(address tokenAddress, string name, string symbol, uint256 initialSupply);

    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) public {
        CustomToken newToken = new CustomToken(name, symbol, initialSupply * (10**18));
        deployedTokens.push(address(newToken));
        emit TokenCreated(address(newToken), name, symbol, initialSupply);
    }

    function getDeployedTokens() public view returns (address[] memory) {
        return deployedTokens;
    }
}