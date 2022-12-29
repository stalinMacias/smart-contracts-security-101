// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Lottery is Ownable {
    using Address for address payable;

    uint8 public winningNumber;

    // Keep track of the number that each player bets for
    mapping(address => uint8) public bets;
    // Prevent that the same number can be used by different players
    mapping(uint => bool) public takenNumbers;

    bool public betsClosed;
    bool public prizeTaken;

    function placeBet(uint8 _number) external payable {
        require(bets[msg.sender] == 0, "Only one bet per player");
        require(takenNumbers[_number] == false, "The selected number has been already taken by another player, choose a different number");
        require(msg.value == 1 ether, "Bet cost: 1 ether");
        require(betsClosed == false, "Bets are closed");
        require(_number > 0 && _number <= 255, "Must be a number from 1 to 255");

        bets[msg.sender] = _number;
        takenNumbers[_number] = true;
    }

    function endLottery() external onlyOwner {
        betsClosed = true;
        winningNumber = pseudoRandNumGen();
    }

    function withdrawPrize() external {
        require(betsClosed == true, "Bets are still running");
        require(prizeTaken == false, "Prize already taken");
        require(bets[msg.sender] == winningNumber, "You aren't the winner");

        prizeTaken = true;

        payable(msg.sender).sendValue(address(this).balance);
    }

    /**
     * @dev - The below function is succeptible to weak-randomness attacks
     * @dev - There is no real entropy and source of randomness within the blockchain
     */
    function pseudoRandNumGen() private view returns (uint8) {
        return uint8(uint256(keccak256(abi.encode(block.timestamp))) % 254) + 1;
    }
}