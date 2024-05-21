// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Custom ERC20 Token
 * This contract creates an ERC20 token with specified details.
 */
contract CustomERC20Token is ERC20 {
    /**
     * @dev Constructor function that initializes the ERC20 token with a name, symbol, and initial supply.
     * @param tokenName Name of the token.
     * @param tokenSymbol Symbol of the token.
     * @param initialSupplyAmount Initial supply of the token, denominated in the smallest unit.
     */
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 initialSupplyAmount
    ) ERC20(tokenName, tokenSymbol) {
        // Mint initial supply to the contract deployer.
        _mint(msg.sender, initialSupplyAmount);
    }
}

/**
 * @title Token Factory
 * This contract allows for the creation and tracking of multiple CustomERC20Token contracts.
 */
contract TokenFactory {
    /**
     * @dev Array to store addresses of deployed tokens.
     */
    address[] public deployedTokenAddresses;

    /**
     * @dev Event to notify when a new token is created.
     * @param newTokenAddress Address of the newly created token.
     * @param tokenName Name of the token.
     * @param tokenSymbol Symbol of the token.
     * @param initialSupply Supply of the token, not adjusted for decimals.
     */
    event TokenCreation(address indexed newTokenAddress, string tokenName, string tokenSymbol, uint256 initialSupply);

    /**
     * @dev Function to create a new CustomERC20Token.
     * @param name The name for the new token.
     * @param symbol The symbol for the new token.
     * @param initialSupply The initial supply for the new token, denominated in the token's smallest unit.
     */
    function createCustomToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) public {
        CustomERC20Token newToken = new CustomERC20Token(name, symbol, initialSupply * (10**18));
        deployedTokenAddresses.push(address(newToken));

        emit TokenCreation(address(newToken), name, symbol, initialSupply);
    }

    /**
     * @dev Getter function for retrieving addresses of all deployed tokens.
     * @return An array of addresses for each deployed token.
     */
    function getAllDeployedTokens() public view returns (address[] memory) {
        return deployedTokenAddresses;
    }
}