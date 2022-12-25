// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract Callee2 {
  uint256 public x;  // Slot 1

  /**
   * @dev - When setX(uint256 _x) function is invoked through a delegateCall(), the function will update the storage slot 0 of the caller contract!
   */
  function setX(uint256 _x) external {
    x = _x + _x;
  }
}