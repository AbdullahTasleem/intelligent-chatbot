const validateIbmUser = require('./ibm-auth');

module.exports = function(req, res, next) {
  const token = req.header('Authorization');
  validateIbmUser
    .validateIbmToken(token)
    .then(payload => {
      console.log('Valid Token = ' + JSON.stringify(payload));
      next();
    })
    .catch(error => {
      console.error(error);
      res.status(401);
      res.json({
        status: 401,
        message: 'Invalid Token'
      });
    });
};
