var express = require("express");

var app = express();
var libParse = require('./libParse');
var mysql = require('mysql');

var con = mysql.createConnection({
    host: "sql7.freesqldatabase.com",
    user: "sql7295537",
    password: "8mI76qvWm6",
    database: "sql7295537"
  });
  con.connect(function(err) {
    if (err) {
        throw err;
    }

app.use(express.static('public'));

//make way for some custom css, js and images
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/images', express.static(__dirname + '/public/images'));

var server = app.listen(8081, function(){
    var port = server.address().port;
    console.log("Server started at http://localhost:%s", port);
});


app.get('/query', function(request, response)
{
    var query = libParse.processSearchForm(request.query);
    var start = new Date();
    console.log("Searching for: " + query);
        con.query(query, function (err, result, fields) {
          if (err) {
              throw err;
              response.status(400).send('Error in database operation');
          }
      var resultsArray = [[]];
      //fill first entry in array with colomn names
      Object.keys(fields).forEach(function(key) {
        // Do stuff with name
        resultsArray[0].push(fields[key].name);
      });
    
        var count = 1;
        Object.keys(result).forEach(function(key) {
          // Do stuff with name
          resultsArray.push([]);
    
          resultsArray[0].forEach(function(element) {
            if(result[key][element] != null) {
              resultsArray[count].push(result[key][element]);
            }
            else {
            resultsArray[count].push("");
            } 
          });
          count++
    
        });
      var end = new Date();
      console.log('Search sompleted, Time elapsed: %sms', end - start);
      //console.log("json is " + encodeURIComponent(json));
      response.setHeader('Content-Type', 'application/json');
          response.send(
            resultsArray
          );
  });
    });
    });




    
    




