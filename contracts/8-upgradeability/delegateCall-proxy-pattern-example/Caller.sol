// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract Caller {
  uint256 public x;       // Slot 1
  address public callee;  // Slot 2

  function callCallee(uint256 _num) external {
    // call() executes and uses the storage of the calle contract!
    // All changes made by this call() will be applied only in the called contract! 
    (bool success, ) = callee.call(abi.encodeWithSignature("setX(uint256)", _num));
    require(success, "Error");
  }

  function delegatecallCallee(uint256 _num) external {
    // delegateCall() executes the logic of the calle contract, but uses the storage of this contract! 
    // The storage of this contract is the one that will be updated
    (bool success, ) = callee.delegatecall(abi.encodeWithSignature("setX(uint256)", _num));
    require(success, "Error");
  }

  function staticcallCalleee(uint256 _num) external view {
    (bool success, ) = callee.staticcall(abi.encodeWithSignature("setX(uint256)", _num));
    require(success, "Error");
  }

  function setCalleeAddress(address _callee) external {
    callee = _callee;
  }
}
