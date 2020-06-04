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
    var databaseUrl = 'mongodb://localhost:27017';    // mongodb://[ipAddress]:[Port]

    // Connect to DB
    MongoClient.connect(databaseUrl, function(err, db) {
        if (err) throw err;

        console.log('Connect to Mongo Database : ' + databaseUrl);

        database = db.db('local');      // db name
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

// Auth to user
var authUser = function(database, id, password, callback)
{
    console.log('Called authUser');

    // Reference 'users' collection
    var users = database.collection('users');

    // Search for user using id & pw
    users.find({"id" : id}, {"password" : password}).toArray(function(err, docs) {
        if (err) {
            callback(err, null);
            return;
        }

        if (docs.length > 0) {
            console.log('Match the user, ID[%s]', id);
            callback(null, docs);
        } else {
            console.log('Cannot find matched user');
            callback(null, null);
        }
    });
}

// Add Users
var addUser = function(database, id, password, name, callback)
{
    console.log('Called addUser : ' + id + ', ' + password + ', ' + name);

    // Reference 'users' collection
    var users = database.collection('users');

    users.insertMany([{"id":id, "password":password, "name":name}], function(err, result) {
        if (err) {
            callback(err, null);
            return;
        }

        if (result.insertedCount > 0) {
            console.log("Add User Record: " + result.insertedCount);
        } else {
            console.log("There is Record");
        }

        callback(null, result);
    });
}

// Router
var router = express.Router();

router.route('/process/login').post(function(req, res){
    console.log('Called /process/login');

    console.log('Called /process/login');

    var paramId = req.body.id;
    var paramPassword = req.body.password;

    console.log("requested id[%s], pw[%s]", paramId, paramPassword);

    if (database) {
        authUser(database, paramId, paramPassword, function(err, docs) {
            if (err) { throw err; }

            if (docs) {
                console.dir(docs);
                res.writeHead('200', {'Content-Type': 'text/html; charset=utf8'});
                res.write('<h1>Success LOGIN</h1>')
                res.end();
            } else {
                res.writeHead('200', {'Content-Type': 'text/html; charset=utf8'});
                res.write('<h1>Fail to LOGIN</h1>')
                res.end();
            }
        });
    } else {
        res.writeHead('200', {'Content-Type': 'text/html; charset=utf8'});
        res.write('<h1>Fail to Connect DB</h1>')
        res.end();
    }
});

router.route('/process/addUser').post(function(req, res) {
    console.log('Called /process/addUser');

    var paramId = req.body.id || req.query.id;
    var paramPassword = req.body.password || req.query.password;
    var paramName = req.body.name || req.query.name;

    console.log('Requested Parameter : ' + paramId + ', ' + paramPassword + ', ' + paramName);

    if (database) {
        addUser(database, paramId, paramPassword, paramName, function(err, result){
            if (err) {throw err;}

            if (result && result.insertedCount > 0) {            // Success to add user
                console.dir(result);

                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>Success to User Add</h2>');
                res.end();
            } else {        // Fail to add user
                res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>Fail to User Add</h2>');
                res.end();
            }
        });
    } else {        // Database is not initialized
        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
        res.write('<h2>Fail to Connect DB</h2>');
        res.end();
    }
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