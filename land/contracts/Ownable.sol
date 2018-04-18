pragma solidity ^0.4.2;

/**
 * Ownable Contract:
 * The Ownable contract has an owner address, and provides basic authorization control
 * functions.
 */
contract Ownable {

    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // The Ownable constructor sets the original `owner` of the contract to the sender account.
    function Ownable() public {
        owner = msg.sender;
    }

    // Ensures that only the address of the owner can perform an action.
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    // Allows the current owner to transfer control of the contract to a newOwner.

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0));
        OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

}










