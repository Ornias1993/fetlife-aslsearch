/**
 * FetLife Profile Sheets
 *
 * This file provides easy access to global config.
 *
 * @author <a href="https://github.com/Ornias1993">Ornias1993</a>
 */

//General Config
var CONFIG = {};
CONFIG.debug = true;

//SQL Connection Config
CONFIG.SQLconnectionName = 'sql7.freesqldatabase.com:3306';
CONFIG.SQLuser = 'sql7295537';
CONFIG.SQLuserPwd = '8mI76qvWm6';
CONFIG.SQLdb = 'sql7295537';

//List of used headings
CONFIG.Fields = {
  // The order of the elements of this array may matter.
  // TODO: Make the order not matter?
  'headings': [
    'last_updated',
    'user_id',
    'nickname',
    'age',
    'gender',
    'role',
    'friend_count',
    'paid_account',
    'location_locality',
    'location_region',
    'location_country',
    'avatar_url',
    'sexual_orientation',
    'interest_level',
    'looking_for',
    'relationships',
    'ds_relationships',
    'bio',
    'websites',
    'last_activity',
    'fetishes_into',
    'fetishes_curious_about',
    'num_pics',
    'num_vids',
    'latest_posts',
    'groups_lead',
    'groups_member_of',
    'events_going_to',
    'events_maybe_going_to'
  ]
}

/**
 * Simple utility logger.
 */
function debugLog (data) {
  if (CONFIG.debug) { Logger.log(data); }
}