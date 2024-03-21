const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const fs = require("fs");
const requestModule = require('request');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const app = express();
console.log("Server live");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())
const file= fs.readFileSync("meh.txt");
const WTFJSON= JSON.parse(file);
const https = require('https');

function printCurrentDateAndTime(){
  var data = new Date();
    console.log(data.getHours());
    console.log(data.getMinutes());
}

// gReturnParser();
//
//getCommuteTime();

setInterval(getCommuteTime, 1000*60*15);




function sendCommuteTimeOverEmail({distance, duration, duration_in_traffic}) {
    let emailMessage = 'distance: ' + distance + ' miles \n'
    + 'current commute: ' + duration_in_traffic + ' minutes \n'
    + 'normal commute time: ' + duration + ' minutes \n'
    let data = {
        service_id: WTFJSON.service_id,
        template_id: WTFJSON.template_id,
        user_id: WTFJSON.user_id,
        template_params: {
            'subject': 'Current Commute',
            'message': emailMessage
        },
        accessToken: WTFJSON.accessToken
    };
    let request = JSON.stringify(data);
    requestModule.post({
        url: 'https://api.emailjs.com/api/v1.0/email/send',
        headers: {'content-type': 'application/json'},
        body: request
    }, function (error, response, body) {
        console.log(body);
    });
    console.log("Email sent");
}

function gReturnParser(mock){
    let dis = parseFloat(mock.distance.text.split(" ")[0]);
    let dur =parseFloat(mock.duration.text.split(" ")[0]);
    let durT =parseFloat(mock.duration_in_traffic.text.split(" ")[0]);
        return {distance: dis, duration: dur, duration_in_traffic: durT};
}

function getCommuteTime(){
    let currentHour = new Date().getHours();
    let currentMinute = new Date().getMinutes();
    let minutesIntoDay = currentHour*60 + currentMinute;
    let dayOfWeek = new Date().getDay();
    if(dayOfWeek === 0 || dayOfWeek === 6){
        return;
    }
    if(minutesIntoDay < 1050 || minutesIntoDay > 1110){
        return;
    }

    var fromHomeToWork =
        "https://maps.googleapis.com/maps/api/distancematrix/json?destinations=place_id:" + WTFJSON.work_place_id + "&departure_time=now&origins=place_id:" + WTFJSON.home_place_id + "&units=imperial&key=" + WTFJSON.gapi;

    var fromWorkToHome = "https://maps.googleapis.com/maps/api/distancematrix/json?destinations=place_id:" + WTFJSON.home_place_id + "&departure_time=now&origins=place_id:" + WTFJSON.work_place_id + "&units=imperial&key=" + WTFJSON.gapi;
    https.get(fromWorkToHome, res => {
        let data = [];
        const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date';
        console.log('Status Code:', res.statusCode);
        console.log('Date in Response header:', headerDate);

        res.on('data', chunk => {
            data.push(chunk);
        });

        res.on('end', () => {
            const users = JSON.parse(Buffer.concat(data).toString());
            var nums =gReturnParser(users.rows[0].elements[0]);
            sendCommuteTimeOverEmail(nums);
        });
    }).on('error', err => {
        console.log('Error: ', err.message);
    });
}



app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);



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
  res.render('error');
});

module.exports = app;
