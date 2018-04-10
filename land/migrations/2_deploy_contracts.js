//var LandAccess = artifacts.require("../contracts/LandAccess.sol");
//var LandBase = artifacts.require("../contracts/LandBase.sol");
var LandAccess = artifacts.require("LandAccess");
var LandBase = artifacts.require("LandBase");
module.exports = function(deployer) {
    deployer.deploy(LandAccess);
    deployer.link(LandAccess, LandBase);
    deployer.deploy(LandBase);
};
//     deployer.deploy(LandA).then(function(){
//         return deployer.deploy(LandBase, LandA.address)
// });
// };

    