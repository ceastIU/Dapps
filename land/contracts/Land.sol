pragma solidity ^0.4.17;

// Declare contract
contract Land {
    struct Property {
        uint id;
        int lat;
        int long;
        string name;
        uint rank;
        uint rent;
    } 
    // Solidity has a unique type called an address. 
    //Addresses are Ethereum addresses, stored as 20 byte values. 
    address[16] public landOwners; // Array of eth addresses, fixed length of 16
    // Store accounts that own/owned property
    mapping(address => bool) public owners;
    // A mapping from id to property, stores candidates
    mapping (uint => Property) public properties;
    // Store # of owners
    uint public ownersCount; // There's no way to iterate over mappings, thus we must keep counter
    // Read candidate
    string public candidate;
    function buy(uint landId) public returns (uint) {
        require(landId >= 0 && landId <= 15); // Requires landId to be inbetween 0 - 15

        landOwners[landId] = msg.sender; // Address of the person/smart contract that called this func

        return landId;
    }

    function getLandOwners() public view returns (address[16]) {
        return landOwners;
    }
}