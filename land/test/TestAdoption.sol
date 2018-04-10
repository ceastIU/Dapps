pragma solidity ^0.4.17;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/LandAccess.sol";
//import web3;

contract TestAdoption {

    // Testing the adopt() function
    function testOwner() {
        LandAccess landAccess = LandAccess(DeployedAddresses.LandAccess());

        address returnedId = landAccess.owner();
        //web3.eth.getBalance;
        address expected = 0x0;

        Assert.equal(returnedId, expected, "Owner should be the 0-th account.");
    }

    // it("should put 10000 MetaCoin in the first account", function() {
    // return MetaCoin.deployed().then(function(instance) {
    //   return instance.getBalance.call(accounts[0]);
    // }).then(function(balance) {
    //   assert.equal(balance.valueOf(), 10000, "10000 wasn't in the first account");
    // });
}
