// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AgreedPrice is Ownable {
  uint256 public price;

  constructor(uint256 _price) {
    price = _price;
  }

  /**
   * @notice The below version of the function is vulnerable to Access Control attacks.
   * @notice because anybody can call it an update the price
   */
  // function updatePrice(uint256 _price) external {
  //   price = _price;
  // }

  /**
   * @notice The below version of the function has solved the Access Control vulnerability
   * @notice Now uses the onlyOwner modifier from the Ownable contract from the OpenZeppelin library
   * @dev - onlyOwner modifier allows only the contract's owner to execute the function
   * @notice The contract ownership can be transferred
   */
  function updatePrice(uint256 _price) external onlyOwner {
    price = _price;
  }

}