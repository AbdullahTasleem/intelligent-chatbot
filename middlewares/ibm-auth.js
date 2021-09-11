// const querystring = require('querystring');
const request = require('request');
const Promise = require('promise');

const TOKEN_VERIFICATION_ENDPOINT =
  process.env.TOKEN_VERIFICATION_ENDPOINT ||
  'https://www.ibm.com/developerworks/dwwi/jsp/verifyaccess.jsp?resource=';
const VERIFY_TOKEN_API_KEY = process.env.VERIFY_TOKEN_API_KEY || 'DNA_CHATBOT';

function validateIbmToken(token) {
  return new Promise((resolve, reject) => {
    request(
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json'
        },
        uri: TOKEN_VERIFICATION_ENDPOINT + VERIFY_TOKEN_API_KEY,
        method: 'GET'
      },
      (error, res, body) => {
        const bodyObject = JSON.parse(body);
        console.log('verification return obj' + body);
        if (error) {
          reject(error);
        } else if (bodyObject.authorized === 'true') {
          resolve(body);
        } else {
          reject(body);
        }
      }
    );
  });
}

const ibmAuth = Object.create(null);
ibmAuth.validateIbmToken = validateIbmToken;

module.exports = ibmAuth;
