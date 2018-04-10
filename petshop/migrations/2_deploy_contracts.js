var Adoption = artifacts.require("Adoption");
var Buying = artifacts.require("Buying");

module.exports = function(deployer) {
  deployer.deploy(Adoption);
  deployer.deploy(Buying);
};