/**
 * Checks the data we received from the scraper to make sure it is as valid as can be.
 *
 * @param {object} obj Scraped input data.
 * @return {object} Filtered input with unsanitized or invalid inputs removed.
 */

var libSQL = require('./libSQL');
module.exports = {
    /**
   * Handler for the main search form.
   */
 
  processSearchForm: function  (form_object) {
    console.log("Parsing: " + form_object);

    return libSQL.GetFromDB (buildSQLQuery(form_object));
  },

  processScrapeResult: function  (scrap_object) {
    console.log("Scrape Parsing: " + scrape_object);

    return "some output";
  }
};
  
function validateScraperInput (obj) {
    var safe_obj = {};
    
    for (var k in obj) {
      if(typeof obj[k] == 'string'){
        mysql_real_escape_string(obj[k]);
      } 
      
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
          if (-1 !== CONFIG.Fields.headings.indexOf(k)) {
            safe_obj[k] = obj[k];
          }
          break;
      }
    }
    return safe_obj;
  }

  
  /**
   * Adds data the Database.
   *
   * @param {Object} data An object with named properties.
   * @return {Object}
   */
    function saveProfileData (data) {
    // check if userentry already exists
    var row_index = GetFromDB ("SELECT User_ID FROM UserData where User_ID= " + data.user_id)
    
    //if not already here, dont update, add new
    if (!row_index[1]) {
    var insert = requestInsert(data);
    return insert
    }
  
    else if (row_index[1]) {
    var update = requestUpdate(data);
    return update
    }
  
    else{
     return {
      'DB_Response': "Cant Process",
      'for_User' : data.user_id
    };
  }
  }
  
  /**
   * Creates an Array from scraperdata to send to SQL Insert processor
   */
  
  function requestInsert (data){
    var toInsert = [[]];
    toInsert.push([]);
  
    //creates array of data to write away
    for (var key in data) {
      toInsert[0].push(key);
      toInsert[1].push(data[key]);
      
      }
    var response = InsertToDB(data.user_id, toInsert);
      
    return {
      'DB_Response': "Added",
      'for_User' : response
    };
  }
  
  
  /**
   * Creates an Array from scraperdata to send to SQL Update processor
   */
  
  function requestUpdate (data){
    var toUpdate = [[]];
    toUpdate.push([]);
    //creates list of data to write away
    for (var key in data) {
      toUpdate[0].push(key);
      toUpdate[1].push(data[key]);
      
      }
    var response = UpdateToDB(data.user_id, toUpdate);
    
  
     return {
      'DB_Response': "Updated",
      'for_User' : response
    };
  }
  

  
  /**
   * Creates SQL query from search form input.
   */
  function buildSQLQuery (params) {
    // always add "where C is not null" to the query to avoid getting inactive user IDs
    var query = 'select user_id, nickname, age, gender, role, friend_count, paid_account, location_locality, location_region, location_country, avatar_url, sexual_orientation, interest_level, looking_for, num_pics, num_vids FROM UserData where nickname is not null';
    for (var x in params) {
      if (params[x]) {
        switch (x) {
          case 'nickname[search]':
            if(params['nickname[operator]'] == "matches"){
            query += " and nickname= '" + params[x] + "'";
            break;
            }
            else{
            query += ' and nickname ' + params['nickname[operator]'] + ' "' + params[x] + '"';
            break
            }
          case 'user[bio]':
            if(params['bio[operator]'] == "matches"){
            query += " bio= '" + params[x] + "'";
            break;
            }
            else{
            query += ' and bio ' + params['user[bio][operator]'] + ' "' + params[x] + '"';
            break
            }
          case 'user[websites]':
            if(params['websites[operator]'] == "matches"){
            query += " websites= '" + params[x] + "'";
            break;
            }
            else{
            query += ' and websites ' + params['user[websites][operator]'] + ' "' + params[x] + '"';
            break;
            }
          case 'user[fetishes_into]':
            if(params['fetishes_into[operator]'] == "matches"){
            query += " fetishes_into= '" + params[x] + "'";
            break;
            }
            else{
            query += ' and fetishes_into ' + params['user[fetishes_into][operator]'] + ' "' + params[x] + '"';
            break;
            }
          case 'user[fetishes_curious_about]':
            if(params['fetishes_curious_about[operator]'] == "matches"){
            query += " fetishes_curious_about= '" + params[x] + "'";
            break;
            }
            else{
            query += ' and fetishes_curious_about ' + params['user[fetishes_curious_about][operator]'] + ' "' + params[x] + '"';
            break
            }
          case 'min_age':
            query += ' and age >= ' + params[x];
            break;
          case 'max_age':
            query += ' and age <= ' + params[x];
            break;
          case 'friends[count]':
            query += ' and friend_count ' + params['friend_count[operator]'] + ' ' + params[x];
            break;
          case 'friends[exclude_zero]':
            query += ' and friend_count != 0';
            break;
          case 'pictures[count]':
            query += ' and num_pics ' + params['num_pics[operator]'] + ' ' + params[x];
            break;
          case 'pictures[exclude_zero]':
            query += ' and num_pics != 0';
            break;
          case 'videos[count]':
            query += ' and num_vids ' + params['num_vids[operator]'] + ' ' + params[x];
            break;
          case 'videos[exclude_zero]':
            query += ' and num_vids != 0';
            break;
          case 'user[sex]':
            query += ' and (';
            if ('object' === typeof(params[x])) {
              for (var i in params[x]) {
                query += 'gender="' + params[x][i] + '"';
                if (i < params[x].length - 1) { query += ' or '; }
              }
            } else {
              query += 'gender="' + params[x] + '"';
            }
            query += ')';
            break;
          case 'user[sexual_orientation]':
            query += ' and (';
            if ('object' === typeof(params[x])) {
              for (var i in params[x]) {
                query += 'sexual_orientation="' + params[x][i] + '"';
                if (i < params[x].length - 1) { query += ' or '; }
              }
            } else {
              query += 'sexual_orientation="' + params[x] + '"';
            }
            query += ')';
            break;
          case 'user[role]':
            query += ' and (';
            if ('object' === typeof(params[x])) {
              for (var i in params[x]) {
                query += 'role="' + params[x][i] + '"';
                if (i < params[x].length - 1) { query += ' or '; }
              }
            } else {
              query += 'role="' + params[x] + '"';
            }
            query += ')';
            break;
          case 'user[activity_level]':
            query += ' and (';
            if ('object' === typeof(params[x])) {
              for (var i in params[x]) {
                query += 'interest_level="' + params[x][i] + '"';
                if (i < params[x].length - 1) { query += ' or '; }
              }
            } else {
              query += 'interest_level="' + params[x] + '"';
            }
            query += ')';
            break;
          case 'user[looking_for]':
            query += ' and (';
            if ('object' === typeof(params[x])) {
              for (var i in params[x]) {
                query += 'looking_for= "' + params[x][i] + '"';
                if (i < params[x].length - 1) { query += ' or '; }
              }
            } else {
              query += 'looking_for= "' + params[x] + '"';
            }
            query += ')';
            break;
          case 'location_locality':
            if (params[x]) {
              query += ' and location_locality=' + " '" + params[x] + "'";
            }
            break;
          case 'location_region':
            if (params[x]) {
              query += ' and location_region=' + " '" + params[x] + "'";
            }
            break;
          case 'location_country':
            if (params[x]) {
              query += ' and location_country=' + " '" + params[x] + "'";
            }
            break;
          case 'user[type]':
            if (params[x]) {
              query += ' and paid_account=' + params[x];
            }
            break;
  //        // TODO:
  //        case 'user[vanilla_relationships]':
  //          if (params[x]) {
  //            query += ' and P ' + params[x];
  //          }
  //          break;
        }
      }
    }
    query += " LIMIT 30"; 
    console.log('Built query: ' + query);
    return query;
  }
