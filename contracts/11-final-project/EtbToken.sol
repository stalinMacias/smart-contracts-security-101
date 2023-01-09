// SPDX-License-Identifier: MIT
pragma solidity 0.6.0;

import "@openzeppelin/contracts-legacy/access/Ownable.sol";
import "@openzeppelin/contracts-legacy/math/SafeMath.sol";

contract ETBToken is Ownable {
  using SafeMath for uint256; // @audit-info - Implemented SafeMath library from OpenZeppelin on uint256
  
  // address public owner;  // @audit-info - Implemented Ownable library from OpenZeppelin
  address public etbDex;
  uint256 public totalSupply;
  string public name = "Eat the Blocks Token";
  string public symbol = "ETBT";
  uint8 public decimals = 18;

  mapping(address => uint256) public balances;
  mapping(address => mapping(address => uint256)) private allowances;

  constructor(uint256 initialSupply) public {
    totalSupply = initialSupply;
    balances[msg.sender] = initialSupply;
    // owner = msg.sender;  // @audit-info - Implemented Ownable library from OpenZeppelin
  }

  modifier onlyEtbDex() {
    require(msg.sender == etbDex, "Restricted Access");
    _;
  }

  // @audit-info - Implemented Ownable library from OpenZeppelin
  // modifier onlyOwner() {
  //   require(tx.origin == owner, "Restricted Acces");
  //   _;
  // }

  function setDexAddress(address _dex) external onlyOwner() { // @audit-info - Implemented Ownable library from OpenZeppelin
    etbDex = _dex;
  }

  function transfer(address recipient, uint256 amount) external {
    require(recipient != address(0), "ERC20: transfer from the zero address");
    require(balances[msg.sender].sub(amount) >= 0, "Not enough balance");  // @audit-info - Implemented SafeMath library from OpenZeppelin on uint256

    balances[msg.sender] = balances[msg.sender].sub(amount);   // @audit-info - Implemented SafeMath library from OpenZeppelin on uint256
    balances[recipient] = balances[recipient].add(amount);  // @audit-info - Implemented SafeMath library from OpenZeppelin on uint256
  }

  function approve(address spender, uint256 amount) external {
    require(spender != address(0), "ERC20: approve to the zero address");

    allowances[msg.sender][spender] = amount;
  }

  function transferFrom(
    address sender,
    address recipient,
    uint256 amount
  ) external returns (bool) {
    require(allowances[sender][msg.sender].sub(amount) >= 0, "ERC20: amount exceeds allowance"); // @audit-info - Implemented SafeMath library from OpenZeppelin on uint256
    require(balances[sender].sub(amount) >= 0, "Not enough balance");  // @audit-info - Implemented SafeMath library from OpenZeppelin on uint256

    allowances[sender][msg.sender] = allowances[sender][msg.sender].sub(amount); // @audit-info - Implemented SafeMath library from OpenZeppelin on uint256

    balances[sender] = balances[sender].sub(amount); // @audit-info - Implemented SafeMath library from OpenZeppelin on uint256
    balances[recipient] =  balances[recipient].add(amount);  // @audit-info - Implemented SafeMath library from OpenZeppelin on uint256

    return true;
  }

  function mint(uint256 amount) external onlyEtbDex {
    totalSupply = totalSupply.add(amount);  // @audit-info - Implemented SafeMath library from OpenZeppelin on uint256
    balances[owner()] = balances[owner()].add(amount);  // @audit-info - Implemented SafeMath library from OpenZeppelin on uint256
  }

  function burn(address account, uint256 amount) external onlyEtbDex {
    totalSupply = totalSupply.sub(amount);  // @audit-info - Implemented SafeMath library from OpenZeppelin on uint256
    balances[account] = balances[account].sub(amount);  // @audit-info - Implemented SafeMath library from OpenZeppelin on uint256
  }

  /* --- Getters --- */

  function balanceOf(address account) public view returns (uint256) {
    return balances[account];
  }

  function allowanceOf(address balanceOwner, address spender) public view virtual returns (uint256) {
    return allowances[balanceOwner][spender];
  }
}
