// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

// VICTIM CONTRACT //

import "@openzeppelin/contracts/utils/Address.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SavingsAccountV2 is ReentrancyGuard {
  using Address for address payable;

  mapping(address => uint256) public balanceOf;

  function deposit() external payable nonReentrant {
    balanceOf[msg.sender] += msg.value;
  }

  // if the nonReentrant modifier is not used, the below function is susceptible to reentrant attacks!
  function withdraw() external nonReentrant {
    require(balanceOf[msg.sender] > 0, "Nothing to Withdraw");

    uint256 depositedAmount = balanceOf[msg.sender];

    console.log("");
    console.log("ReentrancyVictim's Contract balance: ", address(this).balance);
    console.log("ReentrancyAttacker's Contract balance: ", balanceOf[msg.sender]);
    console.log("");

    // Error sending the ETH before updating the internal balances
    // sendValue() forwards all the remaining gas of the original transaction
    payable(msg.sender).sendValue(depositedAmount);

    // The internal balance is never updated while the reentrancy attack is happening 
    balanceOf[msg.sender] = 0;
  }

}