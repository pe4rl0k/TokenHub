// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/TokenFactory.sol";

contract TestTokenFactory {

    uint public initialBalance = 10 ether;
    TokenFactory tokenFactory;

    // Assuming TokenFactory emits this event on successful creation
    event TokenCreated(address tokenAddress, string name, string symbol, uint256 totalSupply);

    function beforeEach() public {
        tokenFactory = new TokenFactory();
    }

    function testTokenCreation() public {
        string memory name = "ExampleToken";
        string memory symbol = "EXM";
        uint256 totalSupply = 1000000;
        
        // Assuming createToken returns the token address on success
        address tokenAddr = tokenFactory.createToken(name, symbol, totalSupply);
        Assert.notEqual(tokenAddr, address(0), "Token address should not be address(0) on successful creation.");
    }

    function testTokenCreationWithEmptyName() public {
        string memory name = "";
        string memory symbol = "EXM";
        uint256 totalSupply = 1000000;
        
        // Demonstrating use of try/catch for error handling
        try tokenFactory.createToken(name, symbol, totalSupply) {
            Assert.fail("Token creation with empty name should have failed.");
        } catch {
            // Expected to fail, so catch block is intentionally left blank
        }
    }

    function testTokenCreationWithZeroTotalSupply() public {
        string memory name = "ExampleToken";
        string memory symbol = "EXM";
        uint256 totalSupply = 0;
        
        // Demonstrating use of try/catch for error handling
        try tokenFactory.createToken(name, symbol, totalSupply) {
            Assert.fail("Token creation with zero totalSupply should have failed.");
        } catch {
            // Expected to fail, failure is the correct outcome
        }
    }

    function testDuplicateTokenCreation() public {
        string memory name = "DuplicateToken";
        string memory symbol = "DUP";
        uint256 totalSupply = 1000;
        
        address tokenAddr1 = tokenFactory.createToken(name, symbol, totalSupply);
        Assert.notEqual(tokenAddr1, address(0), "First token creation should succeed.");
        
        // Testing for duplicate creation
        try tokenFactory.createToken(name, symbol, totalSupply) {
            Assert.fail("Duplicate token creation should have failed.");
        } catch {
            // Duplicate creation should fail, so catch block is intentionally left blank
        }
    }

    function testTokenCreationWithEther() public {
        string memory name = "PayableToken";
        string memory symbol = "PAY";
        uint256 totalSupply = 1000;
        
        // Assuming TokenFactory contract is modified to be payable and manages ether-based token creation
        (bool success,) = address(tokenFactory).call{value: 1 ether}(abi.encodeWithSignature("createToken(string,string,uint256)", name, symbol, totalSupply));
        Assert.isTrue(success, "Token creation with ether should succeed if contract is payable and expects ether.");
    }

    function testFallbackReceivesEther() public {
        // Intended to test that the contract can receive and handle ether properly
        (bool success,) = address(tokenFactory).call{value: 1 ether}("");
        Assert.isTrue(success, "Fallback function should successfully receive ether.");
    }
}