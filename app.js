'use strict';

var path = require('path');
var request = require('request');
var every = require('schedule').every;
var cloudflare = require('cloudflare');
var config = require('./config.json');
var zones = [];
var lastKnownGoodIP = "";
var options = {};
var headers = {
    'X-Auth-Email': config.credentials.email,
    'X-Auth-Key': config.credentials.key,
    'Content-Type': 'application/json'
};
var listUrl = "https://api.cloudflare.com/client/v4/zones";

console.log('CloudFlare DynDNS Activated.\n');

console.log('Loading Configuration File and CloudFlare Settings....');
for (var i = 0; i < config.zones.length; i++) {
  console.log('Fetching zone details for zone '+i);
  fetchZoneDetails(i);
}

function fetchZoneDetails(zoneIndex){
  request({url:listUrl+'?name='+config.zones[zoneIndex].name,headers:headers}, function (error, response, body) {
    body = JSON.parse(body);
    zones[zoneIndex] = {
      "name": config.zones[zoneIndex].name,
      "zoneId": body.result[0].id,
      "records": []
    }
    for (var j = 0; j < config.zones[zoneIndex].records.length; j++) {
      console.log('Fetching record details for zone '+zoneIndex+' and record '+j);
      fetchRecordDetails(zoneIndex,j);
    }  
  });
}

function fetchRecordDetails(zoneIndex,recordIndex){
  request({url:listUrl+'/'+zones[zoneIndex].zoneId+'/dns_records?name='+config.zones[zoneIndex].records[recordIndex],headers:headers}, function (error2, response2, body2) {
    console.log('Received record details for zone '+zoneIndex+' / record '+recordIndex)
    body2 = JSON.parse(body2);
    zones[zoneIndex].records[recordIndex] = {
      "name": config.zones[zoneIndex].records[recordIndex],
      "recordId": body2.result[0].id,
      "address": body2.result[0].content
    };
    if(zoneIndex == config.zones.length - 1 && recordIndex == config.zones[zoneIndex].records.length - 1){
      console.log('Done.\n');
      startScheduler();
    }
  });
}

function startScheduler(){
  console.log('Scheduler Started...\n');
  every(config.updateFrequency+'s').do(function() {
    request('http://ipv4.icanhazip.com', function (error, response, body) {
      var externalIP = body.replace(/^\s+|\s+$/g, '');;
      console.log('Current External IP is - <'+externalIP+'>');
      for (var x = 0; x < zones.length; x++) {
        for (var y = 0; y < zones[x].records.length; y++) {
          if(zones[x].records[y].address != externalIP){
            console.log('Checked '+zones[x].records[y].name+' and IP in CloudFlare Is Different To External IP. Updating Record...');
            updateRecord(x,y,externalIP);
          } else {
            console.log('Checked '+zones[x].records[y].name+' and IP in CloudFlare Matches External IP. No update required.');
          }
        }
      }
    });
  });
}

function updateRecord(zoneIndex,recordIndex,externalIP){
  var reqBody = {
    "type": "A",
    "name": zones[zoneIndex].records[recordIndex].name,
    "content": externalIP
  };
  request({method:'PUT',json:true,url:listUrl+'/'+zones[zoneIndex].zoneId+'/dns_records/'+zones[zoneIndex].records[recordIndex].recordId,headers:headers,body:reqBody}, function (error3, response3, body3) {
    zones[zoneIndex].records[recordIndex].address = externalIP;
    console.log('IP Updated For - '+zones[zoneIndex].records[recordIndex].name);
  });
}
