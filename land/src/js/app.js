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
  user: 0,
  con: null,

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
    defaultAccount = web3.eth.accounts[App.user];
    escrowAccount = web3.eth.accounts[9]; 
    return App.initContract();
  },

  initContract: async () => {
    console.log("Init contract");
    $.getJSON('LandBase.json', function(data){
      var LandBaseArtifact = data;
      App.contracts.LandBase = TruffleContract(LandBaseArtifact);
      console.log('check');
      // Set providers
      App.contracts.LandBase.setProvider(App.web3Provider);
      
      App.stage();
      console.log('check');
      App.listenForEvents();
      // Use of contract to retrieve and mark the adopted pets
      //App.con = await App.contracts.LandBase.deployed();
      console.log(App.con);
      
      App.buildLand();

      });
  },
  
  cycleUser: async() =>{
    console.log("New user");
    App.user = (App.user + 1) % 9
    defaultAccount = web3.eth.accounts[App.user];
    App.account = web3.eth.accounts[App.user];
    console.log(defaultAccount);
    App.render();
  },

  // Stage the app for displaying
  stage: async () => {
    console.log('Staging contract');
    var con = await App.contracts.LandBase.deployed()
    var owner = await con.owner();
    await con.setEscrow(escrowAccount,{from:defaultAccount, gas: 500000}).catch(function(err) {console.log(err.message);});
    var escrow = await con.escrow()
    console.log("own",owner);
    console.log("esc", escrow);
    $("#owner").html(owner);
    $("#escrow").html(escrow);
  },

  // Build the land
  buildLand: async () => {
    console.log("Build Land");
    var con = await App.contracts.LandBase.deployed()
    var check = await con.buildCount()
    if (check < testJson.length){
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
    } else {
      console.log("Already built!");
      App.render();
    }
    
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
      // Reload when a new vote is recorded
      
    });
  },

  sellLand: async (landId) => {
    console.log("Sell contract")
  },

  render: async () => {
    var loader = $("#loader");
    var content = $("#content");
    loader.show();
    content.hide();
   

    var con = await App.contracts.LandBase.deployed();
    var buildC = await con.buildCount();
    var count = buildC;
    var owner = await con.owner();
    var escrow = await con.escrow()
    $("#owner").html(owner);
    $("#escrow").html(escrow);
    $("#BuildCount").html("Count: " + count);
    $("#LandAddress").html(App.account);
    var properties = $("#Props");
    for(var x=0; x < count; x++){
      var property = await con.properties(x);
      var owned = await con.landIndexToOwner(x);
      if(owned == "0x0"){
        owned = false;
      } else if (defaultAccount != owned){
        console.log()
        owned = false;
      }
      var sellDis = (!owner) ? "disabled" : "";
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
                            <button type="button" class="btn btn-secondary ${buyDis}" onClick="sell(${id})">Buy</button>
                            <button type="button" class="btn btn-secondary ${sellDis}" onClick="sell(${id})">Sell</button>
                          </div>
                    </div></div>`;

      
      // Render candidate Result
      var propTemplate = "<tr id='"+id+"'><th>" + id + "</th><td>" + name + "</td><td>" + builddate +  "</td><td>" + lat +  "</td><td>" + long + "</td></tr>";
      var flag = 0;
      $("#Props").find("tr").each(function () {
        var name_r = $(this).find("td:eq(0)").text();
        var id_r = $(this).find("td:eq(1)").text();
        if (name == name_r) {
            flag = 1;
        }
      });
      if (flag == 0) {
        properties.append(propTemplate);
        setMaker({name:name, lat:lat, long:long, id:id, index:x, template: buyTemplate});
      }
      if ($('#'+id).length === 0) {
        // code to run if it isn't there
        null
      }
      else {
          // code to run if it is there
      }
    }
      
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
