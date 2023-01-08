// SPDX-License-Identifier: MIT
pragma solidity 0.6.0;

contract ETBToken {
  address public owner;
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
    owner = msg.sender;
  }

  modifier onlyEtbDex() {
    require(msg.sender == etbDex, "Restricted Access");
    _;
  }

  modifier onlyOwner() {
    require(tx.origin == owner, "Restricted Acces"); // @audit-issue - Usage of tx.origin
    _;
  }

  function setDexAddress(address _dex) external { // @audit-issue - Lack of Access Control, anyone can update the dex address
    etbDex = _dex;
  }

  function transfer(address recipient, uint256 amount) external {
    require(recipient != address(0), "ERC20: transfer from the zero address");
    require(balances[msg.sender] - amount >= 0, "Not enough balance");  // @audit-issue - Underflow issue, using a solidity version lower than 0.8, math under/over flows are not handled by solidity

    balances[msg.sender] -= amount;   // @audit-issue - Underflow issue
    balances[recipient] += amount;  // @audit-issue - Underflow issue
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
    require(allowances[sender][msg.sender] - amount >= 0, "ERC20: amount exceeds allowance"); // @audit-issue - Underflow issue
    require(balances[sender] - amount >= 0, "Not enough balance");  // @audit-issue - Underflow issue

    allowances[sender][msg.sender] -= amount; // @audit-issue - Underflow issue

    balances[sender] -= amount; // @audit-issue - Underflow issue
    balances[recipient] += amount;  // @audit-issue - Overflow issue

    return true;
  }

  function mint(uint256 amount) external onlyEtbDex {
    totalSupply += amount;  // @audit-issue - Overflow issue
    balances[owner] += amount;  // @audit-issue - Overflow issue
  }

  function burn(address account, uint256 amount) external onlyEtbDex {
    totalSupply -= amount;  // @audit-issue - Underflow issue
    balances[account] -= amount;  // @audit-issue - Underflow issue
  }

  /* --- Getters --- */

  function balanceOf(address account) public view returns (uint256) {
    return balances[account];
  }

  function allowanceOf(address balanceOwner, address spender) public view virtual returns (uint256) {
    return allowances[balanceOwner][spender];
  }
}
