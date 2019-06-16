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
 * Read up to 500 rows of data from the table and log them.
 */

GetFromDB: function  (query){
var start = new Date();
console.log("Searching for: " + query);
  con.connect(function(err) {
    if (err) throw err;
    con.query(query, function (err, result, fields) {
      if (err) throw err;
    
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
  console.log('Time elapsed: %sms', end - start);
  console.log("SQLOUT: " + resultsArray[0]);
  return resultsArray
});
});
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