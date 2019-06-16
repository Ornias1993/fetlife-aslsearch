var mysql = require('mysql');
var config = require('./config.json');

var con = mysql.createConnection({
    host: config.DBhost,
    user: config.DBusername,
    password: config.DBpassword,
    database: config.DBdatabase
  });

con.connect(function(err) {
    if (err) {
        throw err;
    }});

module.exports = con;
