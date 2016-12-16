var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var app = express();


process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});

// process.on('uncaughtException', function (err) {
//   console.log(err);
//
//   try {
//     var killTimer = setTimeout(function () {
//       process.exit(1);
//     }, 3000);
//     killTimer.unref();
//
//   } catch (e) {
//     console.log('error when exit', e.stack);
//   }
// });



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  console.log("NOT Found")
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    console.log("-----------------   ERROR(development)  -------------------")
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  console.log("-----------------   ERROR(production)  -------------------")
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
