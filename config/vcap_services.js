const fs = require('fs');

function initVcapServices() {
  let vcapServices;
  if (process.env.VCAP_SERVICES) {
    vcapServices = JSON.parse(process.env.VCAP_SERVICES);
  } else {
    try {
      vcapServices = JSON.parse(fs.readFileSync('vcap-local.json', 'utf-8'))
        .dev;
    } catch (e) {
      console.error(e);
    }
  }
  return vcapServices;
}

module.exports = initVcapServices();
