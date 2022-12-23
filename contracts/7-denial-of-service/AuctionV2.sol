// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AuctionV2 is ReentrancyGuard {
  using Address for address payable;

  uint256 public highestBid;
  address payable public currentLeader;

  mapping(address => uint256) public refunds;

  function bid() external payable nonReentrant {
    require(msg.value > highestBid, "Bid not high enough");

    // Validate if the currentLeader has already been set
    // If so, add the current highestBid to the total refunds accumulated by the currentLeader
    if(currentLeader != address(0)) {
      refunds[currentLeader] += highestBid;
    }

    //Update the information of the currentLeader and their highestBid
    currentLeader = payable(msg.sender);
    highestBid = msg.value;
  }

  function withdrawRefund() external nonReentrant {
    // Implemented check-effects-interaction pattern when withdrawing the funds
    uint256 refund = refunds[msg.sender];
    refunds[msg.sender] = 0;
    payable(msg.sender).sendValue(refund);
  }

}