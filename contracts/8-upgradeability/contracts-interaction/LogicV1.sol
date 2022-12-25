// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract LogicV1 {
  uint256 public x;     // Slot 1

  function increaseX() external {
    x++;
  }
}
