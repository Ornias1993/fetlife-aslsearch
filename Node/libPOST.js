

var db = require('./db');
module.exports = {
    /**
   * Handler for the main search form.
   */
 

   validateScraperInput: function (obj) {
    var safe_obj = {};
    
    for (var k in obj) {
      
      switch (k) {
        case 'user_id':
            safe_obj[k] = parseInt(obj[k]);
            obj[k]=db.escape(obj[k]);
            break;
        case 'age':
            safe_obj[k] = parseInt(obj[k]);
            obj[k]=db.escape(obj[k]);
            break;
        case 'friend_count':
            safe_obj[k] = parseInt(obj[k]);
            obj[k]=db.escape(obj[k]);
            break;
        case 'num_pics':
            safe_obj[k] = parseInt(obj[k]);
            obj[k]=db.escape(obj[k]);
            break;
        case 'num_vids':
          safe_obj[k] = parseInt(obj[k]);
          obj[k]=db.escape(obj[k]);
          break;
        case 'paid_account':
          if ('boolean' === typeof(obj[k])) {
            safe_obj[k] = obj[k];
          } else {
            console.log('WARNING: Expected boolean value in ' + obj[k]);
          }
          break;
        case 'avatar_url':
          if (obj[k].match(/^https:\/\/pic[0-9]*\.fetlife\.com/)) {
            obj[k]=db.escape(obj[k]);
            safe_obj[k] = obj[k];
          }
          break;
        default:
          // TODO: Stricter?
          //if (-1 !== CONFIG.Fields.headings.indexOf(k)) {
            obj[k] = obj[k].toString()
          obj[k]=db.escape(obj[k]);
           safe_obj[k] = obj[k];
           
        //  }
          break;
      }
    }
    return safe_obj;
  },


  //id, col, key
  requestUpdate: function (id, input) {
    var data = [[]];
    data.push([]);

    //creates list of data to write away
    for (var key in input) {
      data[0].push(key);
      data[1].push(input[key]);
      
      }
    //UpdateToDB(data.user_id, toUpdate);

  
    // Create a column to edit in the prepared statement for every entry in array
    // Remove trailing spaces and comma
    var cols = "";
    var index, len;
    for (index = 0, len = data[0].length; index < len; ++index) {
    cols += data[0][index] + "=" + data[1][index] +  ", "
  }
    cols = cols.replace(/,\s*$/, "");

    var sql = 'update UserData set ' + cols + ' where user_id =' + id;
console.log("sql: " + sql);

db.query(sql, function (err, result, fields) {
  if (err) {
      throw err;
      response.status(400).end('Error in database operation');
  }

});


   // return the ID of the processed user
   return 
  
    },

      //id, col, key
      requestInsert: function (input) {
    var data = [[]];
    data.push([]);

    //creates list of data to write away
    for (var key in input) {
      data[0].push(key);
      data[1].push(input[key]);
      
      }
    //UpdateToDB(data.user_id, toUpdate);

  
    // Create a column to edit in the prepared statement for every entry in array
    // Remove trailing spaces and comma
    var cols = "";
    var vals = "";
    var index, len;
    for (index = 0, len = data[0].length; index < len; ++index) {
      cols += data[0][index] + ", "
      vals += data[1][index] + ", "
    }
      cols = cols.replace(/,\s*$/, "");
      vals = vals.replace(/,\s*$/, "");

    var sql = "INSERT INTO UserData (" + cols + ") VALUE (" + vals + ")";
console.log("sql: " + sql);

db.query(sql, function (err, result, fields) {
  if (err) {
      throw err;
      response.status(400).end('Error in database operation');
  }

});


   // return the ID of the processed user
   return 
  
    }
  };