pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CustomERC20Token is ERC20 {
    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 initialSupplyAmount
    ) ERC20(tokenName, tokenSymbol) {
        _mint(msg.sender, initialSupplyAmount);
    }
}

contract TokenFactory {
    address[] public deployedTokenAddresses;
    
    mapping(string => address) private tokenNameToAddress;

    event TokenCreation(address indexed newTokenAddress, string tokenName, string tokenSymbol, uint256 initialSupply);

    function createCustomToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) public {
        require(tokenNameToAddress[name] == address(0), "Token with this name already exists.");

        CustomERC20Token newToken = new CustomERC20Token(name, symbol, initialSupply * (10**18));
        deployedTokenAddresses.push(address(newToken));
        tokenNameToAddress[name] = address(newToken);

        emit TokenCreation(address(newToken), name, symbol, initialSupply);
    }

    function getAllDeployedTokens() public view returns (address[] memory) {
        return deployedTokenAddresses;
    }

    function getTokenAddressByName(string memory name) public view returns (address) {
        return tokenNameToAddress[name];
    }
}