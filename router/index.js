var router = require('express').Router();
var logger = require('log4js').getLogger('router.index.js');

router.get('/', function(req, res) {
  logger.info("index");
  res.render('index', {
    title : 'mycuckoo',
    request : req
  });
});

router.get('/login', function(req, res) {
  logger.info("login");
  req.session['user'] ? res.redirect('/') : res.render('login', {
    title : 'mycuckoo－登陆',
    request : req
  });
});

module.exports = router;
