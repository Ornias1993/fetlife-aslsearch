/**
 * Replace the variables in this block with real values.
 * You can find the "Instance connection name" in the Google Cloud
 * Platform Console, on the instance Overview page.
 */
var connectionName = 'sql7.freesqldatabase.com:3306';
var user = 'sql7295537';
var userPwd = '8mI76qvWm6';
var db = 'sql7295537';

var dbUrl = 'jdbc:mysql://' + connectionName + '/' + db;

/**
 * Read up to 1000 rows of data from the table and log them.
 */
function GetFromDB (query){
  var conn = Jdbc.getConnection(dbUrl, user, userPwd);

  var start = new Date();
  var stmt = conn.createStatement();
  stmt.setMaxRows(500);
  console.log(query);
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
    console.log(resultsArray);
/** old
  while (results.next()) {
    var rowString = '';
    for (var col = 0; col < numCols; col++) {
      rowString += results.getString(col + 1) + '\t';
    }
    Logger.log(rowString);
  }
  console.log(rowString);
*/
  results.close();
  stmt.close();

  var end = new Date();
  Logger.log('Time elapsed: %sms', end - start);
  return resultsArray
}

function UpdateToDB(id, col, key) {
  var conn = Jdbc.getConnection(dbUrl, user, userPwd);
  var start = new Date();
  var stmt = conn.prepareStatement("update UserData set " + col + "= ? where user_id = ?");
  
  var send = "";

  if(key != "" && key != null && !isNaN(parseFloat(key)) && isFinite(key)){
    //send int
    send = "int";
    stmt.setInt(1, key);
  }
  else if (key != "" && key != null){
   //send string
   send = "string" + "'" + key + "'";
   stmt.setString(1, "'" + key + "'");
  }
  else{
    //send null
    send = "null";
    stmt.setString(1, null);
  }
    stmt.setInt(2, id);

    console.log("update attempt: " + send);
  
    stmt.executeUpdate();
    stmt.close();
 return send

  }

function mysql_real_escape_string (str) {
     return str
        .replace("\\", "\\\\")
        .replace("\'", "\\\'")
        .replace("\"", "\\\"")
        .replace("\n", "\\\n")
        .replace("\r", "\\\r")
        .replace("\x00", "\\\x00")
        .replace("\x1a", "\\\x1a");
}

