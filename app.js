const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const fileupload = require("express-fileupload")
var methodOverride = require('method-override')



const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const apiRouter = require('./routes/api');


const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(methodOverride('_method'))
app.use(fileupload())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/api', apiRouter);

app.get(`/*`,(req,res)=>{
  res.status(404).render("404")
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log(err)
  res.render('error');
});


module.exports = app;
