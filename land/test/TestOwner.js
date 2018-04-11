var LandAccess = artifacts.require("./LandAccess.sol");
var LandBase   = artifacts.require("./LandBase.sol");
var locations  = require("./test.json");
var imu = locations[0];
console.log('name', imu.name, 'lat', imu.location.lat, 'long', imu.location.lng);
var convertCor = 10000000;

contract("LandBase", function(accounts){
    it("checks to see if the owner is account[0]", function(){
        return LandBase.deployed().then(function(instance){
            return instance.owner();
        }).then(function(owner){
            assert.equal(owner,accounts[0],"owner is the zero account");
        });
    });

    it("checks to see if 'onlyOwner' works", function(){
        return LandBase.deployed().then((instance)=>{
            landIn = instance
            return LandAccess.deployed();
        }).then((instance)=>{
            accIn = instance;
            accIn.setOwner(accounts[1]);
            return accIn.owner();
        }).then((newOwner)=>{
            console.log('own',newOwner);
            assert.equal(newOwner, accounts[1], "ownership has changed");
        });
    });

    it("throws an exception for invalid call by non-owner", function(){
        return LandBase.deployed().then((instance)=>{
            baseInstance = instance;
            return LandAccess.deployed();
        }).then(async (instance)=>{
            accIn = instance;
            await accIn.setOwner(accounts[1]);
            console.log('1');
            return accIn.setOwner(accounts[0], {from: accounts[0]});
        }) .then(assert.fail).catch((error)=> {
            assert(error.message.indexOf('revert')>=0, "error message must contain revert");
        });
    });

    it("checks to see if we can build", function(){
        return LandBase.deployed().then((instance)=>{
            baseInstance = instance;
            console.log('1',imu.location.lat*convertCor,'2', imu.location.lat*convertCor==391677028);
            return baseInstance.createLand(imu.name, 391677028,391677028); //(imu.location.lat*convertCor), (imu.location.lng*convertCor));
        }).then(async (result)=>{
            var landId = result.logs[0].args.landId;
            console.log('li',landId);
        });
    })

    
    // it("it initializes the candidates with the correct values", function() {
    //     return LandAccess.deployed().then(function(instance) {
    //       LandAccessInstance = instance;
    //       return LandAccessInstance.candidates(1);
    //     }).then(function(candidate) {
    //       assert.equal(candidate[0], 1, "contains the correct id");
    //       assert.equal(candidate[1], "Candidate 1", "contains the correct name");
    //       assert.equal(candidate[2], 0, "contains the correct votes count");
    //       return LandAccessInstance.candidates(2);
    //     }).then(function(candidate) {
    //       assert.equal(candidate[0], 2, "contains the correct id");
    //       assert.equal(candidate[1], "Candidate 2", "contains the correct name");
    //       assert.equal(candidate[2], 0, "contains the correct votes count");
    //     });
    //   });
});