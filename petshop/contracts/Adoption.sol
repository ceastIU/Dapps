pragma solidity ^0.4.2;

// Declare contract
contract Adoption {
    // Solidity has a unique type called an address. 
    //Addresses are Ethereum addresses, stored as 20 byte values. 
    address[16] public adopters; // Array of eth addresses, fixed length of 16

    function adopt(uint petId) public returns (uint) {
        require(petId >= 0 && petId <= 15); // Requires petId to be inbetween 0 - 15

        adopters[petId] = msg.sender; // Address of the person/smart contract that called this func

        return petId;
    }

    function getAdopters() public view returns (address[16]) {
        return adopters;
    }
}