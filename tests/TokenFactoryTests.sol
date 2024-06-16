// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/TokenFactory.sol";

contract TestTokenFactory {

    uint public initialBalance = 10 ether;
    TokenFactory private tokenFactory;

    // Commonly used strings for token details
    string private constant NAME = "ExampleToken";
    string private constant SYMBOL = "EXM";
    uint256 private constant TOTAL_SUPPLY = 1000000;
    string private constant EMPTY_NAME_FAIL_MSG = "Token creation with empty name should have failed.";
    string private constant ZERO_SUPPLY_FAIL_MSG = "Token creation with zero totalSupply should have failed.";
    string private constant DUPLICATE_CREATION_FAIL_MSG = "Duplicate token genuine creation should have failed.";
    string private constant FIRST_CREATION_SUCCESS_MSG = "First token creation should succeed.";
    string private constant TOKEN_CREATION_ETHER_SUCCESS_MSG = "Token creation with ether should succeed if contract is payable and expects ether.";
    string private constant FALLBACK_SUCCESS_MSG = "Fallback function should successfully receive ether.";

    function beforeEach() public {
        tokenFactory = new TokenFactory();
    }

    function testTokenCreation() public {
        address tokenAddr = tokenFactory.createToken(NAME, SYMBOL, TOTAL_SUPPLY);
        Assert.notEqual(tokenAddr, address(0), "Token address should not be address(0) on successful creation.");
    }

    function testTokenCreationWithEmptyName() public {
        try tokenFactory.createToken("", SYMBOL, TOTAL_SUPPLY) {
            Assert.fail(EMPTY_NAME_FAIL_MSG);
        } catch {}
    }

    function testTokenCreationWithZeroTotalSupply() public {
        try tokenFactory.createToken(NAME, SYMBOL, 0) {
            Assert.fail(ZERO_SUPPLY_FAIL_MSG);
        } catch {}
    }

    function testDuplicateTokenCreation() public {
        address tokenAddr1 = tokenFactory.createToken("DuplicateToken", "DUP", 1000);
        Assert.notEqual(tokenAddr1, address(0), FIRST_CREATION_SUCCESS_MSG);
        
        try tokenFactory.createToken("DuplicateToken", "DUP", 1000) {
            Assert.fail(DUPLICATE_CREATION_FAIL_MSG);
        } catch {}
    }

    function testTokenCreationWithEther() public {
        (bool success,) = address(tokenFactory).call{value: 1 ether}(abi.encodeWithSignature("createCombo(string,string,uint256)", "PayableToken", "PAY", 1000));
        Assert.isTrue(success, TOKEN_CREATION_ETHER_SUCCESS_MSG);
    }

    function testFallbackReceivesEther() public {
        (bool success,) = address(tokenFactory).call{value: 1 ether}("");
        Assert.isTrue(success, FALLBACK_SUCCESS_MSG);
    }
}