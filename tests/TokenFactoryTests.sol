pragma solidity ^0.8.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/TokenFactory.sol";

contract TestTokenFactory {

    uint public initialBalance = 10 ether;
    TokenFactory tokenFactory;

    event TokenCreated(address tokenAddress, string name, string symbol, uint256 totalSupply);

    function beforeEach() public {
        tokenFactory = new TokenFactory();
    }

    function testTokenCreation() public {
        string memory name = "ExampleToken";
        string memory symbol = "EXM";
        uint256 totalSupply = 1000000;
        TestTokenFactory(tokenFactory).TokenCreated(name, symbol, totalSupply);
        Assert.equal(tokenFactory.createToken(name, symbol, totalSupply), true, "Token should be created successfully");
    }

    function testTokenCreationWithEmptyName() public {
        string memory name = "";
        string memory symbol = "EXM";
        uint256 totalSupply = 1000000;
        (bool success,) = address(tokenFactory).call(abi.encodePacked(tokenFactory.createToken.selector, abi.encode(name, symbol, totalSupply)));
        Assert.isFalse(success, "Token creation with empty name should fail");
    }

    function testTokenCreationWithZeroTotalSupply() public {
        string memory name = "ExampleToken";
        string memory symbol = "EXM";
        uint256 totalSupply = 0;
        (bool success,) = address(tokenFactory).call(abi.encodePacked(tokenFactory.createToken.selector, abi.encode(name, symbol, totalSupply)));
        Assert.isFalse(success, "Token creation with zero totalSupply should fail");
    }

    function testDuplicateTokenCreation() public {
        string memory name = "DuplicateToken";
        string memory symbol = "EXM";
        uint256 totalSupply = 1000;
        tokenFactory.createToken(name, symbol, totalSupply);
        (bool success,) = address(tokenFactory).call(abi.encodePacked(tokenFactory.createToken.selector, abi.encode(name, symbol, totalSupply)));
        Assert.isFalse(success, "Duplicate token creation should fail");
    }

    function testTokenCreationWithEther() public {
        string memory name = "PayableToken";
        string memory symbol = "PAY";
        uint256 totalSupply = 1000;
        (bool success,) = address(tokenFactory).call{value: 1 ether}(abi.encodeWithSignature("createToken(string,string,uint256)", name, symbol, totalSupply));
        Assert.isTrue(success, "Token creation with ether should succeed if contract is payable and expects ether");
    }

    function testFallbackReceivesEther() public {
        (bool success,) = address(tokenFactory).call{value: 1 ether}("");
        Assert.isTrue(success, "Fallback function should successfully receive ether");
    }
}