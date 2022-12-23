// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Beware the logic of this contract may be succeptible to DoS Attacks

contract Auction is Ownable, ReentrancyGuard {
  using Address for address payable;

  uint256 public highestBid;
  address payable public currentLeader;

  struct Refund {
    address payable addr;
    uint256 amount;
  }

  Refund[] public refunds;

  function bid() external payable nonReentrant {
    require(msg.value > highestBid, "Bid not high enough");

    // Validate if the currentLeader has already been set
    // If so, that means the currentLeader and its highestBid will be replaced, and their info needs to be stored in the refunds[]
    if(currentLeader != address(0)) {
      refunds.push(Refund(currentLeader, highestBid));
    }

    currentLeader = payable(msg.sender);
    highestBid = msg.value;
  }

  function refundAll() external onlyOwner nonReentrant {
    for(uint256 i = 0; i < refunds.length; i++) {
      refunds[i].addr.sendValue(refunds[i].amount);
    }
    delete refunds;
  }

}