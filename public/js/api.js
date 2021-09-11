// The Api module is designed to handle all interactions with the server

var Api = (function() {
  var requestPayload;
  var responsePayload;
  const arabiaAPIKey = 'RE5BcmFiaWEtU2l0ZQ==';
  const africaAPIKey = 'RE5BZnJpY2EtU2l0ZQ==';
  const oldAfricaAPIKey = 'T2xkQWZyaWNhQVBJS2V5';
  var messageEndpoint = '/api/message';

  // Publicly accessible methods defined
  return {
    sendRequest: sendRequest,

    // The request/response getters/setters are defined here to prevent internal methods
    // from calling the methods without any of the callbacks that are added elsewhere.
    getRequestPayload: function() {
      return requestPayload;
    },
    setRequestPayload: function(newPayloadStr) {
      requestPayload = JSON.parse(newPayloadStr);
    },
    getResponsePayload: function() {
      return responsePayload;
    },
    setResponsePayload: function(newPayloadStr) {
      responsePayload = JSON.parse(newPayloadStr);
    }
  };

  // Send a message request to the server
  function sendRequest(text, context) {
    // Build request payload
    var payloadToWatson = {};
    if (text) {
      payloadToWatson.input = {
        text: text
      };
    }
    if (context) {
      payloadToWatson.context = context;
    }

    // Built http request
    var http = new XMLHttpRequest();
    http.open('POST', messageEndpoint, true);
    http.setRequestHeader('Content-type', 'application/json');
    http.setRequestHeader('API-Key', oldAfricaAPIKey);
    // http.setRequestHeader(
    //   'Authorization',
    //   'bearer b489d9b9ebb56b7f045cb5b72fb25f98a82377ec81725b9dc12654191c375bfa04f1ab082c08a350bdb3168ea994e6f5ad639e76f73e8fb98c24fb74b9cbd8c9ba41e31b5476d7702fd1f06d910623f7cd2e0b4e912b7ce4f07f5be5ad596a3b8ce600f4fd09216d16e7ded1ee5031767b285cf8f917de268c24fb74b9cbd8c93bdbf2f924c9b89dd8f4029b8d78fbe8592b50771267dd6cb6f01750f96ff432edcfa3b8dcd9072f9b22e117748fcae5'
    // );
    http.onreadystatechange = function() {
      if (http.readyState === 4 && http.status === 200 && http.responseText) {
        Api.setResponsePayload(http.responseText);
      }
    };

    var params = JSON.stringify(payloadToWatson);
    // Stored in variable (publicly visible through Api.getRequestPayload)
    // to be used throughout the application
    if (Object.getOwnPropertyNames(payloadToWatson).length !== 0) {
      Api.setRequestPayload(params);
    }

    // Send request
    http.send(params);
  }
})();
