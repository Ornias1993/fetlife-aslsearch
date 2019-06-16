var express = require("express");

var app = express();
var libParse = require('./libParse');

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
    console.log("request: " + request.query);
    var output = libParse.processSearchForm(request.query);
    console.log("output: " + output);
    json = JSON.stringify(output);
    var response = json;
    console.log("response: " + response);
    console.log("json is " + encodeURIComponent(json));
    response.setHeader('Content-Type', 'application/json');
        response.send(JSON.stringify({
            message: response
        }));
});



