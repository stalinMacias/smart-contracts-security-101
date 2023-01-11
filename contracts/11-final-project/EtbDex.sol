// SPDX-License-Identifier: MIT
pragma solidity 0.6.0;

import { ETBToken } from "./EtbToken.sol";

import "@openzeppelin/contracts-legacy/access/Ownable.sol";
import "@openzeppelin/contracts-legacy/math/SafeMath.sol";

contract EtbDex is Ownable {
  using SafeMath for uint256; // @audit-info - Implemented SafeMath library from OpenZeppelin on uint256

  //address public owner;
  ETBToken private _etbToken;
  uint256 public fee;
  // bytes32 private password; // @audit-info - Access control is handled based on the caller account

  uint256 public ownerFees;

  constructor(address _token) public {
    _etbToken = ETBToken(_token);
    //password = _password; // @audit-info - Access control is handled based on the caller account
    //owner = msg.sender;
  }

  // @audit-info Added this function to run tests - Delete it after testing is complete!
  receive() external payable {}

  // modifier onlyOwner() {
  //   require(msg.sender == owner, "You are not the owner!"); // @audit-info - Access control is handled based on the caller account
  //   _;
  // }

  function buyTokens() external payable {
    require(msg.value > 0, "Should send ETH to buy tokens");
    require(_etbToken.balanceOf(owner()).sub(msg.value) >= 0, "Not enough tokens to sell");  // @audit-info - Implemented SafeMath library from OpenZeppelin on uint256
    _etbToken.transferFrom(owner(), msg.sender, msg.value.sub(calculateFee(msg.value))); // @audit-info - Implemented SafeMath library from OpenZeppelin on uint256
  }

  // @audit-info - Implemented check-effects-interaction pattern
  function sellTokens(uint256 _amount) external {
    require(_etbToken.balanceOf(msg.sender).sub(_amount) >= 0, "Not enough tokens"); // @audit-info - Implemented SafeMath library from OpenZeppelin on uint256

    _etbToken.burn(msg.sender, _amount);
    _etbToken.mint(_amount);

    //payable(msg.sender).send(_amount);  // @audit-info - send() is deprecated, using the call{value:_amount}("") approach to send ETHs
    (bool success, ) = payable(msg.sender).call.value(_amount)("");
    require(success, "Error when sending the ETH on the sellTokens function - DEX Contract");

  }

  function setFee(uint256 _fee) external onlyOwner() {  // @audit-info - Using Ownable library to handle the access control
    fee = _fee;
  }

  function calculateFee(uint256 _amount) internal returns (uint256 _fee) {
    _fee = _amount.div(100).mul(fee);
    ownerFees = ownerFees.add(_fee);
  }

  function withdrawFees() external onlyOwner() {  // @audit-info - Using Ownable library to handle the access control
    // @audit-info - Implemented a mechanism to keep track of the owner's fees
    // @audit-info - send() is deprecated, using the call{value:_amount}("") approach to send ETHs
    (bool success, ) = payable(msg.sender).call.value(ownerFees)("");
    require(success, "Error when sending the ETH on the sellTokens function - DEX Contract");
  }
}
