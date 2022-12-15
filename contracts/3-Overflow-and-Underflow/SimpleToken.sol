// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts-legacy/access/Ownable.sol";
import "@openzeppelin/contracts-legacy/math/SafeMath.sol";

contract SimpleToken is Ownable {
  using SafeMath for uint256;

  mapping(address => uint256) public balanceOf;
  uint256 public totalSupply;

  constructor(uint256 _initialSupply) public {
    totalSupply = _initialSupply;
    balanceOf[msg.sender] = _initialSupply;
  }

  // this transfer() function solves the overflow/underflow bugs by using the math functions from the OpenZeppelin's SafeMath library
  function transfer(address _to, uint256 _amount) public {
    require(balanceOf[msg.sender].sub(_amount) >= 0, "Not enough tokens");
    balanceOf[msg.sender] = balanceOf[msg.sender].sub(_amount);
    balanceOf[_to] = balanceOf[_to].add(_amount);
  }

  /**
   * @dev - The below function is an example of code that is vulnerable to overflow/underflow bugs
   */
   /*
  function transfer(address _to, uint256 _amount) public {
    require(balanceOf[msg.sender] - (_amount) >= 0, "Not enough tokens");
    // underflow when the subtrahend is greather than the minuend => The difference is below 0! 
    balanceOf[msg.sender] -= _amount;
    balanceOf[_to] += _amount;
  }
  */

  function mint(uint256 amount) external {
    totalSupply = totalSupply.add(amount);
    balanceOf[owner()] = balanceOf[owner()].add(amount);
  }
}