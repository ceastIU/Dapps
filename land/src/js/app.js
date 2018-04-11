// var locations  = require("../json/test.json");
// var imu = locations[0];
// console.log('name', imu.name, 'lat', imu.location.lat, 'long', imu.location.lng);
var convertCor = 10000000;
//var obj = require("./test.json");
var testJson;
var ajaxRequest = new XMLHttpRequest();
ajaxRequest.onreadystatechange = function(){
	console.log("Ready state changed!");
  //more on this in a second
  if(ajaxRequest.readyState == 4){
    //the request is completed, now check its status
    if(ajaxRequest.status == 200){
      testJson = JSON.parse(ajaxRequest.responseText);
      console.log('final',testJson);
    }
    else{
      console.log("Status error: " + ajaxRequest.status);
    }
  }
  else{
    console.log("Ignored readyState: " + ajaxRequest.readyState);
  }
}
ajaxRequest.open("GET", "http://localhost:3000/json/test.json", true);
ajaxRequest.send()
console.log('final',testJson);

var App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    // Load pets.
    // $.getJSON('../pets.json', function(data) {
    //   var petsRow = $('#petsRow');
    //   var petTemplate = $('#petTemplate');

    //   for (i = 0; i < data.length; i ++) {
    //     petTemplate.find('.panel-title').text(data[i].name);
    //     petTemplate.find('img').attr('src', data[i].picture);
    //     petTemplate.find('.pet-breed').text(data[i].breed);
    //     petTemplate.find('.pet-age').text(data[i].age);
    //     petTemplate.find('.pet-location').text(data[i].location);
    //     petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

    //     petsRow.append(petTemplate.html());
    //   }
    // });

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


    return App.initContract();
  },

  initContract: function() {
    $.getJSON('LandBase.json', function(data){
      var LandBaseArtifact = data;
      App.contracts.LandBase = TruffleContract(LandBaseArtifact);

      // Set providers
      App.contracts.LandBase.setProvider(App.web3Provider);

      App.listenForEvents();
      // Use of contract to retrieve and mark the adopted pets
      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.LandBase.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.Build({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },

  render: function() {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");
    console.log('final',testJson[0].name);
    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.LandBase.deployed().then(function(instance) {
      baseInstance = instance;
      return baseInstance.createLand(testJson[0].name, testJson[0].location.lat * convertCor, testJson[0].location.lng * convertCor, {from: accounts[1]});
    }).then(function(properties) {
      console.log('props',properties)
      // for (i in 10000){
      //   if(properties[i])
      // }
    //   var candidatesResults = $("#candidatesResults");
    //   candidatesResults.empty();

    //   var candidatesSelect = $('#candidatesSelect');
    //   candidatesSelect.empty();

    //   for (var i = 1; i <= candidatesCount; i++) {
    //     electionInstance.candidates(i).then(function(candidate) {
    //       var id = candidate[0];
    //       var name = candidate[1];
    //       var voteCount = candidate[2];

    //       // Render candidate Result
    //       var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
    //       candidatesResults.append(candidateTemplate);

    //       // Render candidate ballot option
    //       var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
    //       candidatesSelect.append(candidateOption);
    //     });
    //   }
    //   return electionInstance.voters(App.account);
    // }).then(function(hasVoted) {
    //   // Do not allow a user to vote
    //   if(hasVoted) {
    //     $('form').hide();
    //   }
    //   loader.hide();
    //   content.show();
    // }).catch(function(error) {
    //   console.warn(error);
    });
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
