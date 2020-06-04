// Get the Express Module
var express = require('express');
var http = require('http');
var path = require('path');

// Get the Express MiddleWare
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var static = require('serve-static');
var errorHandler = require('errorhandler');

// Get the Error Handler Module
var expressErrorHandler = require('express-error-handler');

// Get the Session MiddleWare
var expressSession = require('express-session');

// Use MongoDB Module
var MongoClient = require('mongodb').MongoClient;

// Variable for DB
var database;

// Connect to Database
function connectDB()
{
    // Database Information
    var databaseUrl = 'mongodb://localhost:27017/local';    //mongodb://[ipAddress]:[Port]/[db name]

    // Connect to DB
    MongoClient.connect(databaseUrl, function(err, db) {
        if (err) throw err;

        console.log('Connect to Mongo Database : ' + databaseUrl);

        database = db;
    });
}

// Generate the express object
var app = express();

app.set('port', process.env.PORT || 2977);

// Parsing 'application/x-www-form-urlencoded' using body-parser
app.use(bodyParser.urlencoded({ extended: false }));

// Parsing 'application/json' using boody-parser
app.use(bodyParser.json());

// Open the 'public' directory of static
app.use('/public', static(path.join(__dirname, 'public')));

// Setting cookie-parser
app.use(cookieParser());

// Setting Session
app.use(expressSession({
    secret:'my key',
    resave: true,
    saveUninitialized: true
}));

// Router
var router = express.Router();

router.route('/process/login').post(function(req, res){
    console.log('/process/login 호출됨');
});

// Router 객체 등록
app.use('/', router)

// ===== 404 Error ===== //
var errorHandler = expressErrorHandler({
    static: {
        '404': './public/404.html'
    }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

// ===== Server Start ===== //
http.createServer(app).listen(app.get('port'), function() {
    console.log('Server is Start. Port: ' + app.get('port'));

    connectDB();
});