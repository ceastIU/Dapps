// var locations  = require("../json/test.json");
// var imu = locations[0];
// console.log('name', imu.name, 'lat', imu.location.lat, 'long', imu.location.lng);
var convertCor = 10000000;
var testJson;
var ajaxRequest = new XMLHttpRequest();
var that = this;
ajaxRequest.onload = function(){
  if(ajaxRequest.status == 200){
    testJson = JSON.parse(ajaxRequest.responseText);
    console.log('xml finished',testJson);
  }
  else{
    console.log("Status error: " + ajaxRequest.status);
  }
}

ajaxRequest.open("GET", "http://localhost:3000/json/stage1.json", true);
ajaxRequest.send()

function sell(landId) {
  console.log("Function Land", landId);
  App.sellLand(landId);
}


var App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    console.log("Hi");
    that.sell(1);
    testME("init");
    return App.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      console.log('setting to local blockchain');
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:9545');
    }
    web3 = new Web3(App.web3Provider);
    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#LandAddress").html(account);
      }
    });
    defaultAccount = web3.eth.accounts[0];
    escrowAccount = web3.eth.accounts[9]; 
    return App.initContract();
  },

  initContract: async () => {
    console.log("Init contract");
    $.getJSON('LandBase.json', function(data) {
      var LandBaseArtifact = data;
      App.contracts.LandBase = TruffleContract(LandBaseArtifact);
    
      // Set providers
      App.contracts.LandBase.setProvider(App.web3Provider);
      
      App.stage();
      
      App.listenForEvents();
      // Use of contract to retrieve and mark the adopted pets
      App.buildLand();
      //return App.render();


    });
  },

  // Stage the app for displaying
  stage: async () => {
    var con = await App.contracts.LandBase.deployed()
    var owner = await con.owner();
    var escrow = await con.setEscrow(escrowAccount);
    $("#owner").html(owner);
    $("#escrow").html(escrow);
  },

  // Build the land
  buildLand: async () => {
    console.log("Build Land");
    var con = await App.contracts.LandBase.deployed()
    var promises = [];
    for(i in testJson){
      console.log(testJson[i])
      promises.push(con.createLand(testJson[i].name, testJson[i].location.lat * convertCor, 
        testJson[i].location.lng * convertCor, {from:defaultAccount, gas: 500000}));
    }

    Promise.all(promises).then((receipt)=>{
      console.log('Receipt:',receipt);
      //$("#LandAddress").html("Land: " + properties);
      App.render();
    }).catch((error)=>{
        console.log('err',error);
        App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: async () => {
    var con = await App.contracts.LandBase.deployed();
    con.Build({}, {
      fromBlock: 0,
      toBlock: 'latest'
    }).watch( async (error, event) => {
      console.log("event triggered", event);
      var buildC = await con.buildCount();
      console.log('Count',buildC);
      // Reload when a new vote is recorded
      
    });
  },

  sellLand: async (landId) => {
    console.log("Sell contract")
  },

  render: async () => {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");
    console.log('final',testJson[0].name);
    loader.show();
    content.hide();

    var con = await App.contracts.LandBase.deployed();
    var buildC = await con.buildCount();
    var count = buildC;
    $("#BuildCount").html("Count: " + count);
    console.log(count, typeof(count))
    var properties = $("#Props");
    for(var x=0; x < count; x++){
      var property = await con.properties(x);
      var owned = await con.landIndexToOwner(x);
      if(owned == "0x0"){
        owned = false
      }
      var sellDis = (!owned) ? "disabled" : "";
      var buyDis = (owned) ? "disabled" : "";
      var id = property[0].c.join('');
      var name = property[1];
      var builddate = property[2];
      var lat = property[3]/convertCor;
      var long = property[4]/convertCor;
      var imuLatlng = { lat: lat, lng: long };
      //var test = testMe()
      buyTemplate =  `<div class="card border rounded">
                    <div class="card-header prop">${name}</div>
                    <div class="card-body"><p style="font-size:20px;">Owner: ${owned.toString()}</p>
                    <div class="btn-group btn-group-lg" role="group">
                            <button type="button" class="btn btn-default ${buyDis}" onClick="sell(${id})">Buy</button>
                            <button type="button" class="btn btn-default ${sellDis}" onClick="sell(${id})">Sell</button>
                          </div>
                    </div></div>`;

      
      // Render candidate Result
      var propTemplate = "<tr id='"+id+"'><th>" + id + "</th><td>" + name + "</td><td>" + builddate +  "</td><td>" + lat +  "</td><td>" + long + "</td></tr>";
      var flag = 0;
      $("#Props").find("tr").each(function () {
        var name_r = $(this).find("td:eq(0)").text();
        var id_r = $(this).find("td:eq(1)").text();
        console.log("id",id_r)
        console.log(name == name_r, name, name_r)
        if (name == name_r) {
            flag = 1;
        }
      });
      console.log('flag', flag)
      if (flag == 0) {
        properties.append(propTemplate);
        setMaker({name:name, lat:lat, long:long, id:id, index:i, template: buyTemplate});
      }
      if ($('#'+id).length === 0) {
        // code to run if it isn't there
        console.log("!!!!!")
        
      }
      else {
          // code to run if it is there
      }
      // $("#Props tr").each(function(index) {
      //   if (index !== 0) {

      //       $row = $(this);

      //       var id = $row.find("td:nth-child(2)").text();
      //       console.log("id",id)
      //       if (id.indexOf(name) !== 0) {
      //         properties.append(propTemplate);
      //       }
      //       else {
      //         console.log("Already exists")
      //       }
      //   }
      // });
     
    }
    // // Load contract data
    // App.contracts.LandBase.deployed().then(function(instance) {
    //   baseInstance = instance;
    //   owner = instance.owner().then((i)=>{
    //     console.log('in',i);
    //     return i}).then((i)=>{
    //       console.log(i,web3.eth.accounts[0])
    //     });

      
    //   return baseInstance.createLand(testJson[0].name, testJson[0].location.lat * convertCor, testJson[0].location.lng * convertCor, {from:defaultAccount, gas: 500000});
    // }).then(function(properties) {
    //   //console.log('props',properties)
    //   // for (i in 10000){
    //   //   if(properties[i])
    //   // }
    // //   var candidatesResults = $("#candidatesResults");
    // //   candidatesResults.empty();

    // //   var candidatesSelect = $('#candidatesSelect');
    // //   candidatesSelect.empty();

    // //   for (var i = 1; i <= candidatesCount; i++) {
    // //     electionInstance.candidates(i).then(function(candidate) {
    // //       var id = candidate[0];
    // //       var name = candidate[1];
    // //       var voteCount = candidate[2];

    // //       // Render candidate Result
    // //       var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
    // //       candidatesResults.append(candidateTemplate);

    // //       // Render candidate ballot option
    // //       var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
    // //       candidatesSelect.append(candidateOption);
    // //     });
    // //   }
    // //   return electionInstance.voters(App.account);
    // // }).then(function(hasVoted) {
    // //   // Do not allow a user to vote
    // //   if(hasVoted) {
    // //     $('form').hide();
    // //   }
    // //   loader.hide();
    // //   content.show();
    // // }).catch(function(error) {
    // //   console.warn(error);
    // }).catch((error)=>{
    //   console.log('err',error);
    // })
  },

  // bindEvents: function() {
  //   //$(document).on('click', '.btn-adopt', App.handleAdopt);
  // },

  // markAdopted: function(adopters, account) {
  //   var adoptionInstance;

  //   App.contracts.Adoption.deployed().then((instance)=>{
  //     adoptionInstance = instance;

  //     return adoptionInstance.getAdopters.call();
  //   }).then((adopters)=>{
  //     for(i=0; i < adopters.length; i++){
  //       if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
  //         $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
  //       }
  //     }
  //   }).catch(function(err) {
  //     console.log(err.message);
  //   });
  // },

  // console: function(msg) {
  //   console.log(msg);
  // },

  // handleBuy: function(event) {
  //   event.preventDefault();

  //   var locId = parseInt($(event.target).data('id'));

  //   var adoptionInstance;
    
  //   web3.eth.getAccounts(function(error, accounts) {
  //     if (error) {
  //       console.log(error);
  //     }
    
  //     var account = accounts[0];
    
  //     App.contracts.Adoption.deployed().then(function(instance) {
  //       adoptionInstance = instance;
    
  //       // Execute adopt as a transaction by sending account
  //       return adoptionInstance.adopt(petId, {from: account});
  //     }).then(function(result) {
  //       return App.markAdopted();
  //     }).catch(function(err) {
  //       console.log(err.message);
  //     });
  //   });
  // }

};

$(function() {
  $(window).load( function() {
    App.init();
  });
});
