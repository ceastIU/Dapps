pragma solidity ^0.4.2;

// Declare contract
contract Buying {
    // Solidity has a unique type called an address. 
    //Addresses are Ethereum addresses, stored as 20 byte values. 
    address[16] public owners; // Array of eth addresses, fixed length of 16
    mapping(uint => address) public ownersToLand;

    event bought(uint landId);

    function buy(uint landId) public returns (uint) {
        require(landId >= 0 && landId <= 15); // Requires petId to be inbetween 0 - 15
        //require(ownersToLand[landId] == 0x0);

        owners[landId] = msg.sender; // Address of the person/smart contract that called this func
        ownersToLand[landId] = msg.sender;
        bought(landId);
        return landId;
    }

    function getOwners() public view returns (address[16]) {
        return owners;
    }
}