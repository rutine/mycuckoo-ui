const path = require('path');
const express = require('express');
const log4js = require('log4js');
const indexRouter = require('./router/index');

const logger = log4js.getLogger('app.js');
const app = express();


// view engine setup
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'view'));
app.set('view engine', 'html');

//app.use(log4js.connectLogger(log4js.getLogger('http'), {level: log4js.levels.INFO}));
//app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '')));
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// dev
if (app.get('env') === 'dev') {
  app.use(function(err, req, res, next) {
    logger.error(err);
    
    if (req.xhr) {
      res.statusCode = (err.status == 404 ? 404 : 500);
      if (err.status == 404) {
        res.json({ sucess: false, msg: '页面不存在' });
      } else {
        res.json({ sucess: false, msg: '服务器异常' });
      }
    } else {
      res.status(err.status || 500);
      res.render(err.status == 404 ? '404' : 'error', { message : err.message, error : err });
    }
  });
}

// prod
app.use(function(err, req, res, next) {
  logger.error(err);
  
  if (req.xhr) {
    res.statusCode = (err.status == 404 ? 404 : 500);
    if (err.status == 404) {
      res.json({ sucess: false, msg: '页面不存在' });
    } else {
      res.json({ sucess: false, msg: '服务器异常' });
    }
  } else {
    res.status(err.status || 500);
    res.render(err.status == 404 ? '404' : 'error', { message : err.message, error : err });
  }
});

module.exports = app;
