

var db = require('./db');
module.exports = {
    /**
   * Handler for the main search form.
   */
 

   validateScraperInput: function (obj) {
    var safe_obj = {};
    
    for (var k in obj) {
      //db.escape(obj[k]);
      
      switch (k) {
        case 'user_id':
        case 'age':
        case 'friend_count':
        case 'num_pics':
        case 'num_vids':
          safe_obj[k] = parseInt(obj[k]);
          break;
        case 'paid_account':
          if ('boolean' === typeof(obj[k])) {
            safe_obj[k] = obj[k];
          } else {
            debugLog('WARNING: Expected boolean value in ' + obj[k]);
          }
          break;
        case 'avatar_url':
          if (obj[k].match(/^https:\/\/pic[0-9]*\.fetlife\.com/)) {
            safe_obj[k] = obj[k];
          }
          break;
        default:
          // TODO: Stricter?
          //if (-1 !== CONFIG.Fields.headings.indexOf(k)) {
           safe_obj[k] = obj[k];
        //  }
          break;
      }
    }
    return safe_obj;
  },
  /**
 * Creates an Array from scraperdata to send to SQL Insert processor
 */

requestInsert: function (data){
    var toInsert = [[]];
    toInsert.push([]);
  
    //creates array of data to write away
    for (var key in data) {
      toInsert[0].push(key);
      toInsert[1].push(data[key]);
      
      }
    //InsertToDB(data.user_id, toInsert);
      
 
  },
  
  
  /**
   * Creates an Array from scraperdata to send to SQL Update processor
   */
  
  requestUpdate: function (data){
    var toUpdate = [[]];
    toUpdate.push([]);

    //creates list of data to write away
    for (var key in data) {
      toUpdate[0].push(key);
      toUpdate[1].push(data[key]);
      
      }
    //UpdateToDB(data.user_id, toUpdate);

  },


  //id, col, key
  requestUpdate: function (data) {
    var toUpdate = [[]];
    toUpdate.push([]);

    //creates list of data to write away
    for (var key in data) {
      toUpdate[0].push(key);
      toUpdate[1].push(data[key]);
      
      }
    //UpdateToDB(data.user_id, toUpdate);

  
    // Create a column to edit in the prepared statement for every entry in array
    // Remove trailing spaces and comma
    var cols = "";
    var index, len;
    for (index = 0, len = data[0].length; index < len; ++index) {
    cols += data[0][index] + "= ?, "
  }
    cols = cols.replace(/,\s*$/, "");
  
    // Calculate position of the last ? in the prepared statement (user ID)
    var idloc = data[0].length;
    idloc++;
  
    // Connect to database and create a prepared statement using the column string created earlier
    var conn = Jdbc.getConnection(dbUrl, user, userPwd);
    var start = new Date();
    var stmt = conn.prepareStatement("update UserData set " + cols + " where user_id = ?");
  
    
    //For each entry in the array, calculate column position (index +1) and fill in the ? of the prepared statement
    var index2, len2;
    for (index2 = 0, len2 = data[0].length; index2 < len2; ++index2) {
    var send = "";
    var pos = index2;
    var key = data[1][index2];
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
InsertToDB: function(id, keys) {
  
    
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
  
    }

};