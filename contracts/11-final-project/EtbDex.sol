// SPDX-License-Identifier: MIT
pragma solidity 0.6.0;

import { ETBToken } from "./EtbToken.sol";

contract EtbDex {
  address public owner;
  ETBToken private _etbToken;
  uint256 public fee;
  bytes32 private password; // @audit-issue - Privacy issue - No real privacy in the blockchain

  constructor(address _token, bytes32 _password) public {
    _etbToken = ETBToken(_token);
    password = _password;
    owner = msg.sender;
  }

  // @audit-info Added this function to run tests - Delete it after testing is complete!
  receive() external payable {}

  modifier onlyOwner(bytes32 _password) {
    require(password == _password, "You are not the owner!"); // @audit-issue - Incorrect mechanism of validation, to validate ownership is a best practice to use addresses
    _;
  }

  function buyTokens() external payable {
    require(msg.value > 0, "Should send ETH to buy tokens");
    require(_etbToken.balanceOf(owner) - msg.value >= 0, "Not enough tokens to sell");  // @audit-issue - Underflow issue
    _etbToken.transferFrom(owner, msg.sender, msg.value - calculateFee(msg.value)); // @audit-issue - Underflow issue
  }

  // @audit-issue - This function is succeptible to reentrancy, implement check-effects-interaction pattern
  function sellTokens(uint256 _amount) external {
    require(_etbToken.balanceOf(msg.sender) - _amount >= 0, "Not enough tokens"); // @audit-issue - Underflow issue

    payable(msg.sender).send(_amount);  // @audit-issue - send() is deprecated, should use the call{value:_amount}("") approach to send ETHs
    //(bool success, ) = payable(msg.sender).call.value(_amount)("");
    //require(success, "Error when sending the ETH on the sellTokens function - DEX Contract");

    _etbToken.burn(msg.sender, _amount);
    _etbToken.mint(_amount);
  }

  function setFee(uint256 _fee, bytes32 _password) external onlyOwner(_password) {  // @audit-issue - Improper mechanism to implement the Access Control, validation is made based on information that anyone can access
    fee = _fee;
  }

  function calculateFee(uint256 _amount) internal view returns (uint256) {
    return (_amount / 100) * fee; // @audit-issue - Underflow issue
  }

  function withdrawFees(bytes32 _password) external onlyOwner(_password) {  // @audit-issue - Improper mechanism to implement the Access Control, validation is made based on information that anyone can access
    // @audit-issue - Owner will drain all the ETHs from the contract, is withdrawing all the ETH balance instead of only withdrawing is corresponding part of the fees
    // @audit-info - Is required to implement a mechanism to keep track of the owner's fees
    payable(msg.sender).send(address(this).balance);  // @audit-issue - send() is deprecated, should use the call{value:_amount}("") approach to send ETHs
  }
}
