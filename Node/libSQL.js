/**
 * FetLife Profile Sheets
 *
 * This file provides Utility functions to connect to a SQL database.
 *
 * @author <a href="https://github.com/Ornias1993">Ornias1993</a>
 */

//Global SQL Config
var mysql = require('mysql');

var con = mysql.createConnection({
    host: "sql7.freesqldatabase.com",
    user: "sql7295537",
    password: "8mI76qvWm6",
    database: "sql7295537"
  });

  

module.exports = {
/**
 * Read up to 1000 rows of data from the table and log them.
 */

 test: function() {
  con.connect(function(err) {
    if (err) throw err;
    con.query("SELECT COUNT(*) FROM UserData", function (err, result, fields) {
      if (err) throw err;
      console.log(result);
    });
  });
 },

GetFromDB: function  (query){
  var conn = Jdbc.getConnection(dbUrl, user, userPwd);

  var start = new Date();
  var stmt = conn.createStatement();
  stmt.setMaxRows(500);
  console.log("Searching for: " + query);
  var results = stmt.executeQuery(query);
  var meta = results.getMetaData();
  var numCols = meta.getColumnCount();

  var resultsArray = [[]];

  // The column count starts from 1
  for (var i = 1; i <= numCols; i++ ) {
  // Do stuff with name
  resultsArray[0].push(meta.getColumnName(i));
  }

  var count = 1;
  while(results.next()) {
      resultsArray.push([]);
      for (var i = 1; i <= numCols; i++)
        if(results.getString(i) != null) {
          resultsArray[count].push(results.getString(i));
        }
        else {
        resultsArray[count].push("");
        } 
      count++;


  }
  results.close();
  stmt.close();

  var end = new Date();
  Logger.log('Time elapsed: %sms', end - start);
  return resultsArray
},


//id, col, key
UpdateToDB: function (id, keys) {

  
  // Create a column to edit in the prepared statement for every entry in array
  // Remove trailing spaces and comma
  var cols = "";
  var index, len;
  for (index = 0, len = keys[0].length; index < len; ++index) {
  cols += keys[0][index] + "= ?, "
}
  cols = cols.replace(/,\s*$/, "");

  // Calculate position of the last ? in the prepared statement (user ID)
  var idloc = keys[0].length;
  idloc++;

  // Connect to database and create a prepared statement using the column string created earlier
  var conn = Jdbc.getConnection(dbUrl, user, userPwd);
  var start = new Date();
  var stmt = conn.prepareStatement("update UserData set " + cols + " where user_id = ?");

  
  //For each entry in the array, calculate column position (index +1) and fill in the ? of the prepared statement
  var index2, len2;
  for (index2 = 0, len2 = keys[0].length; index2 < len2; ++index2) {
  var send = "";
  var pos = index2;
  var key = keys[1][index2];
  pos++;

  //use setInt, setString and setNull respectively
  if(key != "" && key != null && !isNaN(parseFloat(key)) && isFinite(key)){
    //send int
    stmt.setInt(pos, key);
  }
  else if (key != "" && key != null){
   //send string
   stmt.setString(pos, key);
  }
  else{
    //send null
    stmt.setString(pos, null);
  }
    
}
    //Set the Where user_id = ID part of the Query
    stmt.setInt(idloc, id);

    //Execute and clossed
    stmt.executeUpdate();
    stmt.close()

 // return the ID of the processed user
 return id

  },


//id, col, key
InsertToDB: function (id, keys) {

  
  // Create a column to edit in the prepared statement for every entry in array
  // Remove trailing spaces and comma
  var cols = "";
  var vals = "";
  var index, len;
  for (index = 0, len = keys[0].length; index < len; ++index) {
  cols += keys[0][index] + ", "
  vals += "?, "
}
  cols = cols.replace(/,\s*$/, "");
  vals = vals.replace(/,\s*$/, "");

  // Connect to database and create a prepared statement using the column string created earlier
  var conn = Jdbc.getConnection(dbUrl, user, userPwd);
  var start = new Date();
  var stmt = conn.prepareStatement("INSERT INTO UserData (" + cols + ") VALUE (" + vals + ")");

  
  //For each entry in the array, calculate column position (index +1) and fill in the ? of the prepared statement
  var index2, len2;
  for (index2 = 0, len2 = keys[0].length; index2 < len2; ++index2) {
  var send = "";
  var pos = index2;
  var key = keys[1][index2];
  pos++;

  //use setInt, setString and setNull respectively
  if(key != "" && key != null && !isNaN(parseFloat(key)) && isFinite(key)){
    //send int
    stmt.setInt(pos, key);
  }
  else if (key != "" && key != null){
   //send string
   stmt.setString(pos, key);
  }
  else{
    //send null
    stmt.setString(pos, null);
  }
    
}

    //Execute and clossed
    stmt.executeUpdate();
    stmt.close();

 // return the ID of the processed user
 return id

  },


  mysql_real_escape_string: function  (str) {
     return str
        .replace("\\", "\\\\")
        .replace("\'", "\\\'")
        .replace("\"", "\\\"")
        .replace("\n", "\\\n")
        .replace("\r", "\\\r")
        .replace("\x00", "\\\x00")
        .replace("\x1a", "\\\x1a");
}

};