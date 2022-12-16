// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/utils/Address.sol";

contract SavingsAccount {
  using Address for address payable;
  
  mapping(address => uint256) public balanceOf;

  function deposit() external payable {
    balanceOf[msg.sender] += msg.value;
  }
  
  function withdraw() external {
    uint256 amountDeposited = balanceOf[msg.sender];
    balanceOf[msg.sender] = 0;

    // @bug transfer() only forwards 2300 gas units
    // If the receiver contract executes any logic other than emitting an event, the transaction will fail because the receiver contract will run out of gas
    // An error like this would occur: "Error: Transaction reverted: contract call run out of gas and made the transaction revert"
    // Resource: https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/
    //payable(msg.sender).transfer(amountDeposited);

    // Implementing the sendValue() function from the Address library of OpenZeppelin
    payable(msg.sender).sendValue(amountDeposited);

  }

}