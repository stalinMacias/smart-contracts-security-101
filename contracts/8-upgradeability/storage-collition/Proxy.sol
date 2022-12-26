// SPDX-License-Identifier: UNLICENSED
// ONLY FOR DEMONSTRATION PURPOSES, DO NOT USE THIS IN PRODUCTION

pragma solidity ^0.8.0;

contract Proxy {
  uint256 public x;             // Slot 1
  address public owner;         // Slot 2
  address public logicContract; // Slot 3

  constructor(address _logic) {
    logicContract = _logic;
    owner = msg.sender;
  }

  function upgrade(address _newLogicContract) external {
    require(msg.sender == owner, "Access restricted");
    logicContract = _newLogicContract;
  }

  fallback() external {
    (bool success, ) = logicContract.delegatecall(msg.data);
    require(success, "Unexpected error");
  }
}
