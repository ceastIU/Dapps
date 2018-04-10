var ZombieFactory = artifacts.require("ZombieFactory");
var Ownable       = artifacts.require("Ownable");
module.exports = function(deployer) {
  deployer.deploy(Ownable);
  deployer.link(Ownable, ZombieFactory);
  deployer.deploy(ZombieFactory);
};