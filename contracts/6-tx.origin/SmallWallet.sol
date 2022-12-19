// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

contract SmallWallet {
  address public owner;

  constructor() {
    owner = tx.origin;
  }

  function withdrawAll(address _recipient) external {
    // Using tx.origin to validate authorization access can lead to phising attacks
    // Using tx.origin to validate the access will validate that the transaction initiator is the owner, instead of validating the the function's caller is the owner!
        // tx.origin  is the address that started a transaction //
    //require(tx.origin == owner, "Caller not authorized");

    // Using msg.sender to validate the function's caller will always check that the caller's address is the owner!
        // msg.sender is the address of the contract or EOA that calls the first function to be called inside a contract scope //
    require(msg.sender == owner, "Caller not authorized");
    payable(_recipient).transfer(address(this).balance);
  }

  receive() external payable {}
}
