pragma solidity ^0.4.17;

import "./ownable.sol";

// Declare contract
contract LandFactory is Ownable {
    event NewLand(uint id, int lat, int long, string name);
    
    struct Property {
        uint id;
        int lat;
        int long;
        string name;
        bool owned;
        uint rank;
        uint rent;
        uint32 readyTime;
        uint cooldownTime;
    } 

    // All the properties owned or for sale
    Property[] public properties;

    // Solidity has a unique type called an address. 
    //Addresses are Ethereum addresses, stored as 20 byte values. 
    address[16] public landOwners; // Array of eth addresses, fixed length of 16
    // Mapping from id to owner address
    mapping(uint => address) public landToOwner;
    // Keeps track of the number of properties a land owner has
    mapping (address => uint) ownerLandCount;
    
    // Store # of owners
    uint public ownersCount; // There's no way to iterate over mappings, thus we must keep counter

    function buy(uint landId) public returns (uint) {
        require(landId >= 0 && landId <= 15); // Requires landId to be inbetween 0 - 15

        landOwners[landId] = msg.sender; // Address of the person/smart contract that called this func

        return landId;
    }

    function getLandOwners() public view returns (address[16]) {
        return landOwners;
    }

    function createLand(string _name) external onlyOwner {
        require(ownerLandCount[msg.sender] == 0);
        uint randDna = _generateRandomDna(_name);
        randDna = randDna - randDna % 100;
        _createZombie(_name, randDna);
    }
}