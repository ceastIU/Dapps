pragma solidity ^0.4.2;

/// @title Contract that manages special access privileges for the DAPP.
/// @author Chris East
contract LandAccessControl {
    // This facet controls access control for Land. 
    //     - The Owner: The Owner can reassign other roles and change the addresses of our dependent smart
    //         contracts. It is also the only role that can unpause the smart contract. It is initially
    //         set to the address that created the smart contract.
    //
    //     

    /// @dev Emited when contract is upgraded - See README.md for updgrade plan
    event ContractUpgrade(address newContract);

    // The addresses of the accounts (or contracts) that can execute actions within each roles.
    address public ownerAddress;
    //address public devAddress;
    

    // @dev Keeps track whether the contract is paused. When that is true, most actions are blocked
    bool public paused = false;

    /// @dev Access modifier for Owner-only functionality
    modifier onlyOwner() {
        require(msg.sender == ownerAddress);
        _;
    }


    /// @dev Assigns a new address to act as the Owner. Only available to the current Owner.
    /// @param _newOwner The address of the new Owner
    function setOwner(address _newOwner) external onlyOwner {
        require(_newOwner != address(0));
        ownerAddress = _newOwner;
    }

    /*** Pausable functionality adapted from OpenZeppelin ***/

    /// @dev Modifier to allow actions only when the contract IS NOT paused
    modifier whenNotPaused() {
        require(!paused);
        _;
    }

    /// @dev Modifier to allow actions only when the contract IS paused
    modifier whenPaused {
        require(paused);
        _;
    }

    /// @dev Called by any "C-level" role to pause the contract. Used only when
    ///  a bug or exploit is detected and we need to limit damage.
    function pause() external onlyOwner whenNotPaused {
        paused = true;
    }

    /// @dev Unpauses the smart contract. Can only be called by the Owner, 
    /// @notice This is public rather than external so it can be called by
    ///  derived contracts.
    function unpause() public onlyOwner whenPaused {
        // can't unpause if contract was upgraded
        paused = false;
    }
}
