// SPDX-License-Identifier: MIT

/*
  /$$$$$$  /$$$$$$$$ /$$$$$$$$ /$$    /$$ /$$$$$$ /$$$$$$$$ /$$$$$$$
 /$$__  $$|__  $$__/| $$_____/| $$   | $$|_  $$_/| $$_____/| $$__  $$
| $$  \__/   | $$   | $$      | $$   | $$  | $$  | $$      | $$  \ $$
|  $$$$$$    | $$   | $$$$$   |  $$ / $$/  | $$  | $$$$$   | $$$$$$$/
 \____  $$   | $$   | $$__/    \  $$ $$/   | $$  | $$__/   | $$____/
 /$$  \ $$   | $$   | $$        \  $$$/    | $$  | $$      | $$
|  $$$$$$/   | $$   | $$$$$$$$   \  $/    /$$$$$$| $$$$$$$$| $$
 \______/    |__/   |________/    \_/    |______/|________/|__/


*/




/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}


contract ImagineCoin is IERC20 {
  mapping(address => uint256) private _balances;
  mapping(address => mapping(address => uint256)) private _allowances;

  string private _name;
  string private _symbol;
  uint256 private _totalSupply;

  address public owner;

  uint256 constant public pricePerTokenInWei = 100000000000000;
  uint256 constant public maxTokens = 1000000000000000000000000;

  event ImagineMint(address indexed caller, uint256 amount, uint256 transactionValue);
  event ImagineBurn(address indexed caller, uint256 amount);
  event ImagineTransfer(address indexed caller, address indexed from, address indexed to, uint256 value);
  event ImagineApprove(address indexed caller, address indexed spender, uint256 value);

  event ProjectEvent(address indexed poster, string indexed eventType, string content);

  constructor() {
    _name = 'ImagineCoin';
    _symbol = 'IMG';

    owner = msg.sender;
  }

  // Getters

  function name() public view virtual returns (string memory) {
    return _name;
  }

  function symbol() public view virtual returns (string memory) {
    return _symbol;
  }

  function decimals() public view virtual returns (uint8) {
    return 18;
  }

  function totalSupply() public view virtual override returns (uint256) {
    return _totalSupply;
  }

  // balanceOf and allowance should be ignored
  function balanceOf(address account) public view virtual override returns (uint256) {
    return _balances[account];
  }

  function allowance(address owner, address spender) public view virtual override returns (uint256) {
    return _allowances[owner][spender];
  }

  // Contract events

  function mint(uint256 amount) public payable returns (bool) {
    emit ImagineMint(msg.sender, amount, msg.value);
    payable(owner).transfer(msg.value);
    return true;
  }

  function burn(uint256 amount) public returns (bool) {
    emit ImagineBurn(msg.sender, amount);
    return true;
  }

  function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
    emit ImagineTransfer(msg.sender, msg.sender, recipient, amount);
    return true;
  }

  function approve(address spender, uint256 amount) public virtual override returns (bool) {
    ImagineApprove(msg.sender, spender, amount);
    return true;
  }

  function transferFrom(
    address sender,
    address recipient,
    uint256 amount
  ) public virtual override returns (bool) {
    emit ImagineTransfer(msg.sender, sender, recipient, amount);
    return true;
  }

  // Administrative Functions

  function transferOwnership(address newOwner) external {
    require(msg.sender == owner, "Only owner can transfer ownership");
    owner = newOwner;
  }

  function emitProjectEvent(string memory _eventType, string memory _content) public {
    require(msg.sender == owner, "Only owner can emit project events");
    emit ProjectEvent(msg.sender, _eventType, _content);
  }

}