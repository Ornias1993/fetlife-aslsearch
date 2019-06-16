var express = require("express");

var app = express();
var libGET = require('./libGET');
var config = require('./config.json');
var db = require('./db');
var libPOST = require('./libPOST');

app.use(express.static('public'));

//make way for some custom css, js and images
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/images', express.static(__dirname + '/public/images'));

var server = app.listen(config.Port, function(){
    var port = server.address().port;
    console.log("Server started at http://localhost:%s", port);



// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Access the parse results as request.body
app.post('/scraper', function(request, response){

    var profiles = JSON.parse(request.body.post_data);
    
    
    if (!(profiles instanceof Array)) {
        profiles = [profiles];
      }
      var feedback = "Recieved " + profiles.length + " scraped users to Process."
      for (var profile in profiles) {
      const processed = libPOST.validateScraperInput(profiles[profile]);


    // check if userentry already exists
    var query = "SELECT user_id FROM UserData where user_id= " + processed.user_id;
    db.query(query, function (err, result, fields) {
        if (err) {
            throw err;
            response.status(400).end('Error in database operation');
        }
else{

//if not already here, dont update, add new
if (result.length == 0) {
    //var insert = requestInsert(data);
    console.log("inserting");
    libPOST.requestInsert(processed);
    output = {
        'DB_Response': "Inserted new user",
        'for_User' : result[0].user_id
      };
    }
  
    else if (result.length == 1) {
    //var update = requestUpdate(data);
    console.log("updating");
    libPOST.requestUpdate(processed);
    output = {
        'DB_Response': "Updated user",
        'for_User' : result[0].user_id
      };

    }
  
    else{
     output = {
      'DB_Response': "Cant Process",
      'for_User' : result[0].user_id
    };
    
  }
  console.log(output);
}

});

}
console.log(feedback);
response.status(200).end(JSON.stringify(feedback));
});

app.get('/query', function(request, response)
{
    var query = libParse.processSearchForm(request.query);
    var start = new Date();
    console.log("Searching for: " + query);
        db.query(query, function (err, result, fields) {
          if (err) {
              throw err;
              response.status(400).send('Error in database operation');
          }
          else{
      var searchResults = libGET.processSearchQuery(fields, result) ;


          var end = new Date();
          console.log('Search sompleted, Time elapsed: %sms', end - start);
          //console.log("json is " + encodeURIComponent(json));
      response.setHeader('Content-Type', 'application/json');
          response.send(
            searchResults
          
          );
          }
  });
    });
    });




    
    




