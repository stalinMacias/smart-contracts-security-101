pragma solidity ^0.8.0;

contract LogicV2 {
  //uint256 public x;               // Slot 1
  //uint256 public y;               // Slot 2
  uint256 public x;             // Slot 1
  address public owner;         // Slot 2
  address public logicContract; // Slot 3
  uint public y;                // Slot 4

  function increaseX() external {
    x += 2;
  }

  function setY(uint256 _y) external {
    y = _y;
  }
}
