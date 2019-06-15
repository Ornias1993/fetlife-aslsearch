/**
 * This is a Tempermonkey script and must be run using a Tempermonkey-compatible browser.
 *
 * @author ornias1993 <kjeld@schouten-lebbing.nl>
 */
// ==UserScript==
// @name		   FetLife ASL Search (Reborn Edition)
// @version		0.5.8
// @namespace	  https://github.com/Ornias1993/fetlife-aslsearch-reborn
// @downloadURL	  https://github.com/Ornias1993/fetlife-aslsearch-reborn/raw/master/fetlife-age-sex-location-search.user.js
// @updateURL	  https://github.com/Ornias1993/fetlife-aslsearch-reborn/raw/master/fetlife-age-sex-location-search.user.js
// @description	Allows you to search for FetLife profiles based on age, sex, location, and role.
// @require		https://code.jquery.com/jquery-2.1.4.min.js
// @include		https://fetlife.com/*
// @exclude		https://fetlife.com/adgear/*
// @exclude		https://fetlife.com/chat/*
// @exclude		https://fetlife.com/im_sessions*
// @exclude		https://fetlife.com/polling/*
// @grant		  GM_log
// @grant		  GM_xmlhttpRequest
// @grant		  GM_addStyle
// @grant		  GM_getValue
// @grant		  GM_setValue
// @grant		  GM_deleteValue
// @grant		  GM_openInTab
// ==/UserScript==

FL_UI = {}; // FetLife User Interface module

//TODO for some reason this cant be removed?
FL_UI.Text = {
    'donation_appeal': ''
};

FL_UI.Dialog = {};
FL_UI.Dialog.createLink = function (dialog_id, html_content, parent_node) {
    var trigger_el = document.createElement('a');
    trigger_el.setAttribute('class', 'opens-modal');
    trigger_el.setAttribute('data-opens-modal', dialog_id);
    trigger_el.innerHTML = html_content;
    return parent_node.appendChild(trigger_el);
};
FL_UI.Dialog.inject = function (id, title, html_content) {
    // Inject dialog box HTML. FetLife currently uses Rails 3, so mimic that.
    // See, for instance, Rails Behaviors: http://josh.github.com/rails-behaviors/
    var dialog = document.createElement('div');
    dialog.setAttribute('style', 'display: none; position: absolute; overflow: hidden; z-index: 1000; outline: 0px none;');
    dialog.setAttribute('class', 'ui-dialog ui-widget ui-widget-content ui-corner-all');
    dialog.setAttribute('tabindex', '-1');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-labelledby', 'ui-dialog-title-' + id);
    var html_string = '<div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix" unselectable="on" style="-moz-user-select: none;">';
    html_string += '<span class="ui-dialog-title" id="ui-dialog-title-' + id + '" unselectable="on" style="-moz-user-select: none;">' + title + '</span>';
    html_string += '<a href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" unselectable="on" style="-moz-user-select: none;">';
    html_string += '<span class="ui-icon ui-icon-closethick" unselectable="on" style="-moz-user-select: none;">close</span>';
    html_string += '</a>';
    html_string += '</div>';
    html_string += '<div data-modal-title="' + title + '" data-modal-height="280" data-modal-auto-open="false" class="modal ui-dialog-content ui-widget-content" id="' + id + '">';
    html_string += html_content;
    html_string += '</div>';
    dialog.innerHTML = html_string;
    document.body.appendChild(dialog);
};

FL_ASL = {}; // FetLife ASL Search main module
FL_ASL.CONFIG = {
    'debug': false, // switch to true to debug.
    //Change these for personal development environment
    'gasapp_url': 'https://script.google.com/macros/s/AKfycbzUFY6t94AxfmbLtBpTUvkjUkAma_j-17rJPPURrkvG6ZR5SPc/exec?embedded=true',
    'gasapp_url_development': 'https://script.google.com/macros/s/AKfycbwxXfsfwPrEPLeXfVqFDNF0gX9wu0Iwj11Pli3xZYw/dev?embedded=true'
};

// Utility debugging function.
FL_ASL.log = function (msg) {
    if (!FL_ASL.CONFIG.debug) { return; }
    GM_log('FETLIFE ASL SEARCH: ' + msg);
};

// XPath Helper function
// @see http://wiki.greasespot.net/XPath_Helper
// Is used for scraping
function $x() {
  var x='';
  var node=document;
  var type=0;
  var fix=true;
  var i=0;
  var cur;

  function toArray(xp) {
    var final=[], next;
    while (next=xp.iterateNext()) {
      final.push(next);
    }
    return final;
  }

  while (cur=arguments[i++]) {
    switch (typeof cur) {
      case "string": x+=(x=='') ? cur : " | " + cur; continue;
      case "number": type=cur; continue;
      case "object": node=cur; continue;
      case "boolean": fix=cur; continue;
    }
  }

  if (fix) {
    if (type==6) type=4;
    if (type==7) type=5;
  }

  // selection mistake helper
  if (!/^\//.test(x)) x="//"+x;

  // context mistake helper
  if (node!=document && !/^\./.test(x)) x="."+x;

  var result=document.evaluate(x, node, null, type, null);
  if (fix) {
    // automatically return special type
    switch (type) {
      case 1: return result.numberValue;
      case 2: return result.stringValue;
      case 3: return result.booleanValue;
      case 8:
      case 9: return result.singleNodeValue;
    }
  }

  return fix ? toArray(result) : result;
};

// Initializations.
var uw = (unsafeWindow) ? unsafeWindow : window ; // Help with Chrome compatibility?
GM_addStyle('\
#fetlife_asl_search_ui_container,\
#fetlife_asl_search_about\
{ display: none; }\
#fetlife_asl_search_ui_container > div {\
    clear: both;\
    background-color: #111;\
    position: relative;\
    z-index: 2;\
    top: -2px;\
}\
#fetlife_asl_search_ui_container div a {\
    text-decoration: underline;\
}\
#fetlife_asl_search_ui_container div a:hover {\
    background-color: blue;\
    text-decoration: underline;\
}\
#fetlife_asl_search_ui_container a[data-opens-modal] { cursor: help; }\
#fetlife_asl_search_ui_container ul.tabs li {\
    display: inline-block;\
    margin-right: 10px;\
    position: relative;\
    z-index: 2;\
}\
#fetlife_asl_search_ui_container ul.tabs li a { color: #888; }\
#fetlife_asl_search_ui_container ul.tabs li.in_section a {\
    background-color: #1b1b1b;\
    color: #fff;\
    position: relative;\
    top: 2px;\
    padding-top: 5px;\
    z-index: 2;\
}\
');
FL_ASL.init = function () {
    FL_ASL.CONFIG.search_form = document.querySelector('form[action="/search"]').parentNode;
    if (FL_ASL.getUserProfileHtml()) {
        FL_ASL.main();
    } else {
        FL_ASL.loadUserProfileHtml(FL_ASL.main);
    }
};
jQuery(document).ready(function () {
    FL_ASL.init();
});

FL_ASL.toggleAslSearch = function () {
    var el = document.getElementById('fetlife_asl_search_ui_container');
    if (el.style.display == 'block') {
        el.style.display = 'none';
    } else {
        el.style.display = 'block';
    }
};

FL_ASL.getUserProfileHtml = function () {
    return GM_getValue('currentUser.profile_html', false);
};

FL_ASL.loadUserProfileHtml = function (callback, id) {
    var id = id || uw.FetLife.currentUser.id;
    FL_ASL.log('Fetching profile for user ID ' + id.toString());
    GM_xmlhttpRequest({
        'method': 'GET',
        'url': 'https://fetlife.com/users/' + id.toString(),
        'onload': function (response) {
            GM_setValue('currentUser.profile_html', response.responseText);
            callback();
        }
    });
};


FL_ASL.getActivateSearchButton = function () {
    var el = document.getElementById('fetlife_asl_search');
    if (!el) {
        el = FL_ASL.createActivateSearchButton();
    }
    return el;
};
FL_ASL.createActivateSearchButton = function () {
    var label = document.createElement('label');
    label.innerHTML = 'A/S/L?';
    var input = document.createElement('input');
    input.setAttribute('style', '-webkit-appearance: checkbox');
    input.setAttribute('type', 'checkbox');
    input.setAttribute('id', 'fetlife_asl_search');
    input.setAttribute('name', 'fetlife_asl_search');
    input.setAttribute('value', '1');
    input.addEventListener('click', FL_ASL.toggleAslSearch);
    label.appendChild(input);
    return label;
};

//Specifies the tabs
FL_ASL.createTabList = function () {
    var ul = document.createElement('ul');
    ul.setAttribute('class', 'tabs');
    html_string = '<li data-fl-asl-section-id="fetlife_asl_search_about"><a href="#">About FetLife ASL Search ' + GM_info.script.version + '</a></li>';
    html_string += '<li class="in_section" data-fl-asl-section-id="fetlife_asl_search_extended"><a href="#">Extended A/S/L search</a></li>';
    ul.innerHTML = html_string;
    ul.addEventListener('click', function (e) {
        var id_to_show = jQuery(e.target.parentNode).data('fl-asl-section-id');
        jQuery('#fetlife_asl_search_ui_container ul.tabs li').each(function (e) {
            if (id_to_show === jQuery(this).data('fl-asl-section-id')) {
                jQuery(this).addClass('in_section');
                jQuery('#' + id_to_show).slideDown();
            } else {
                jQuery(this).removeClass('in_section');
                jQuery('#' + jQuery(this).data('fl-asl-section-id')).slideUp();
            }
        });
    });
    return ul;
};

FL_ASL.createSearchTab = function (id, html_string) {
    var div = document.createElement('div');
    div.setAttribute('id', id);
    //TODO for some reason this cant be removed either
    div.innerHTML = html_string + FL_UI.Text.donation_appeal;
    return div;
};

FL_ASL.importHtmlString = function (html_string, selector) {
    var external_dom = new DOMParser().parseFromString(html_string, 'text/html');
    var doc_part = external_dom.querySelector(selector);
    return document.importNode(doc_part, true);
};


//This contains the content in the tabs
FL_ASL.attachSearchForm = function () {
    var html_string;
    var gurl = (FL_ASL.CONFIG.debug)
        ? FL_ASL.CONFIG.gasapp_url_development
        : FL_ASL.CONFIG.gasapp_url;
    var user_loc = FL_ASL.ProfileScraper.getLocation(
        FL_ASL.importHtmlString(FL_ASL.getUserProfileHtml(), '#profile')
    );
    var label = FL_ASL.getActivateSearchButton();

    var container = document.createElement('div');
    container.setAttribute('id', 'fetlife_asl_search_ui_container');
    container.setAttribute('style', 'display: none;');

    container.appendChild(FL_ASL.createTabList());

    // "About FetLife ASL Search" tab
    html_string = '<p>The FetLife Age/Sex/Location Search user script allows you to search for profiles on <a href="https://fetlife.com/">FetLife</a> by age, sex, location, or orientation. This user script implements what is, as of this writing, the <a href="https://fetlife.com/improvements/78">most popular suggestion in the FetLife suggestion box</a>:</p>';
    html_string += '<blockquote><p>Search for people by Location/Sex/Orientation/Age</p><p>Increase the detail of the kinkster search by allowing us to narrow the definition of the search by the traditional fields.</p></blockquote>';
    html_string += '<p>With the FetLife Age/Sex/Location Search user script installed, a few clicks will save hours of time. Now you can find profiles that match your specified criteria in a matter of seconds. The script even lets you send a message to the profiles you found right from the search results list.</p>';
    html_string += '<p>Stay up to date with the <a href="https://github.com/meitar/fetlife-aslsearch/">latest FetLife ASL Search improvements</a>. New versions add new features and improve search performance.</p>';
    html_string += '<hr><p>FetLife ASL Search is provided as free software, but sadly grocery stores do not offer free food. If you like this script, please consider <a href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=kjeld@schouten-lebbing.nl&amount=&item_name=FetLife%20ASL%20Search">making a donation</a> to support its continued development. &hearts; Thank you. :)</p><hr><Br><br>';
    container.appendChild(FL_ASL.createSearchTab('fetlife_asl_search_about', html_string));

    // Extended search tab
    html_string = '<br><div id="fetlife_asl_search_extended_wrapper">';
    html_string += '<script src="https://unpkg.com/@ungap/custom-elements-builtin"></script>'
    html_string += '<script type="module" src="https://unpkg.com/x-frame-bypass"></script>'
    html_string += '<iframe is="x-frame-bypass" src="' + FL_ASL.CONFIG.gasapp_url.split('?')[0] + '" width="100%" height="500px"><h2><a href="' + gurl + '" target="_blank">Open Extended A/S/L Search</a></h2></iframe>';
    html_string += '<h4><a href="' + gurl + '" target="_blank">Open Extended A/S/L Search in a seperate window</a></h4>'
    html_string += '</div><!-- #fetlife_asl_search_extended_wrapper -->';
    var newdiv = container.appendChild(FL_ASL.createSearchTab('fetlife_asl_search_extended', html_string));

    //Attatch aslsearch dropdown window
    var maincontent
    var maincontent2
    maincontent = document.getElementById('maincontent');
    maincontent2 = document.getElementById('main-content');
    //Option 1 (example:profilepages)
    if (maincontent) {
    maincontent.parentNode.insertBefore(container, maincontent);
}
    //Option 2 (example: friendlists)
    else if (maincontent2) {
    maincontent2.parentNode.insertBefore(container, maincontent2);
}


    FL_ASL.CONFIG.search_form.appendChild(label);


    // Re-attach the search form after page load if for "some reason" it is not here.
    // See https://github.com/meitar/fetlife-aslsearch/issues/27
    setInterval(function () {
        if (!window.document.querySelector('#fetlife_asl_search_ui_container')) {
            FL_ASL.attachSearchForm();
        }
    }, 2000);
};

// ****************************************************
//
// Google Apps Script interface
//
// ****************************************************
FL_ASL.GAS = {};
FL_ASL.GAS.ajaxPost = function (data)  {
    FL_ASL.log('POSTing profile data for ' + data.length + ' users.');
    var url = (FL_ASL.CONFIG.debug)
        ? FL_ASL.CONFIG.gasapp_url_development
        : FL_ASL.CONFIG.gasapp_url;
    GM_xmlhttpRequest({
        'method': 'POST',
        'url': url,
        'data': 'post_data=' + encodeURIComponent(JSON.stringify(data)),
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        'onload': function (response) {
            FL_ASL.log('POST response received: ' + response.responseText);
        },
        'onerror': function (response) {
            FL_ASL.log('Error POSTing to ' + url + ', response received: ' + response.responseText);
        }
    });
};

// ****************************************************
//
// Scrapers
//
// ****************************************************
FL_ASL.ProfileScraper = {};
// Profilescraping sub-scraper functions
FL_ASL.ProfileScraper.getNickname = function () {
    return jQuery('#main_content h2').first().text().split(' ')[0];
};
FL_ASL.ProfileScraper.getAge = function () {
    var x = $x('//h2/*[@class[contains(., "quiet")]]');
    var ret;
    if (x.length) {
        y = x[0].textContent.match(/^\d+/);
        if (y) {
            ret = y[0];
        }
    }
    return ret;
};
FL_ASL.ProfileScraper.getGender = function () {
    var x = $x('//h2/*[@class[contains(., "quiet")]]');
    var ret = '';
    if (x.length) {
        y = x[0].textContent.match(/[^\d ]/);
        if (y) {
            ret = y[0];
        }
    }
    return ret;
};
FL_ASL.ProfileScraper.getRole = function (body) {
    var x = $x('//h2/*[@class[contains(., "quiet")]]');
    var ret = '';
    if (x.length) {
        y = x[0].textContent.match(/ .+/);
        if (y) {
            ret = y[0].trim();
        }
    }
    return ret;
};
FL_ASL.ProfileScraper.getFriendCount = function (body) {
    var x = $x('//h4[starts-with(., "Friends")]');
    var ret = 0;
    if (x.length) {
        ret = x[0].textContent.match(/\(([\d,]+)\)/)[1].replace(',', '');
    }
    return ret;
};
FL_ASL.ProfileScraper.isPaidAccount = function () {
    return (document.querySelector('.fl-badge')) ? true : false;
};
FL_ASL.ProfileScraper.getLocation = function (dom) {
    var dom = dom || document;
    var x = $x('//h2[@class="bottom"]/following-sibling::p//a', dom);
    var ret = {
        'locality': '',
        'region': '',
        'country': ''
    };
    if (3 === x.length) {
        ret['country'] = x[2].textContent;
        ret['region'] = x[1].textContent;
        ret['locality'] = x[0].textContent;
    } else if (2 === x.length) {
        ret['country'] = x[1].textContent;
        ret['region'] = x[0].textContent;
    } else if (1 === x.length) {
        ret['country'] = x[0].textContent;
    }
    return ret;
};
FL_ASL.ProfileScraper.getAvatar = function () {
    var el = document.querySelector('.pan');
    var ret;
    if (el) {
        ret = el.src;
    }
    return ret;
};
FL_ASL.ProfileScraper.getSexualOrientation = function () {
    var x = $x('//table//th[starts-with(., "orientation")]/following-sibling::td');
    var ret = '';
    if (x.length) {
        ret = x[0].textContent.trim();
    }
    return ret;
};
FL_ASL.ProfileScraper.getInterestLevel = function () {
    var x = $x('//table//th[starts-with(., "active")]/following-sibling::td');
    var ret = [];
    if (x.length) {
        ret = x[0].textContent.trim();
    }
    return ret;
};
FL_ASL.ProfileScraper.getLookingFor = function () {
    var x = $x('//table//th[starts-with(., "is looking for")]/following-sibling::td');
    var ret = [];
    if (x.length) {
        ret = x[0].innerHTML.split('<br>');
    }
    return ret;
};
FL_ASL.ProfileScraper.getRelationships = function () {
    var x = $x('//table//th[starts-with(., "relationship status")]/following-sibling::td//a');
    var ret = [];
    for (var i = 0; i < x.length; i++) {
        ret.push(x[i].href.match(/\d+$/)[0]);
    }
    return ret;
};
FL_ASL.ProfileScraper.getDsRelationships = function () {
    var x = $x('//table//th[starts-with(., "D/s relationship status")]/following-sibling::td//a');
    var ret = [];
    for (var i = 0; i < x.length; i++) {
        ret.push(x[i].href.match(/\d+$/)[0]);
    }
    return ret;
};
FL_ASL.ProfileScraper.getBio = function () {
    var html = '';
    jQuery($x('//h3[@class][starts-with(., "About me")]')).nextUntil('h3.bottom').each(function () {
        html += jQuery(this).html();
    });
    return html;
};
FL_ASL.ProfileScraper.getWebsites = function () {
    var x = $x('//h3[@class="bottom"][starts-with(., "Websites")]/following-sibling::ul[1]//a');
    var ret = [];
    for (var i = 0; i < x.length; i++) {
        ret.push(x[i].textContent.trim());
    }
    return ret;
};
FL_ASL.ProfileScraper.getLastActivity = function () {
    // TODO: Convert this relative date string to a timestamp
    var x = document.querySelector('#mini_feed .quiet');
    var ret;
    if (x) {
        ret = x.textContent.trim();
    }
    return ret;
};
FL_ASL.ProfileScraper.getFetishesInto = function () {
    var x = $x('//h3[@class="bottom"][starts-with(., "Fetishes")]/following-sibling::p[1]//a');
    var ret = [];
    for (var i = 0; i < x.length; i++) {
        ret.push(x[i].textContent.trim());
    }
    return ret;
};
FL_ASL.ProfileScraper.getFetishesCuriousAbout = function () {
    var x = $x('//h3[@class="bottom"][starts-with(., "Fetishes")]/following-sibling::p[2]//a');
    var ret = [];
    for (var i = 0; i < x.length; i++) {
        ret.push(x[i].textContent.trim());
    }
    return ret;
};
FL_ASL.ProfileScraper.getPicturesCount = function () {
    var el = document.getElementById('user_pictures_link');
    var ret = 0;
    if (el) {
        ret = el.nextSibling.textContent.match(/\d+/)[0];
    }
    return ret;
};
FL_ASL.ProfileScraper.getVideosCount = function () {
    var el = document.getElementById('user_videos_link');
    var ret = 0;
    if (el) {
        ret = el.nextSibling.textContent.match(/\d+/)[0];
    }
    return ret;
};
FL_ASL.ProfileScraper.getLatestPosts = function () {
    // TODO:
};
FL_ASL.ProfileScraper.getGroupsLead = function () {
    // TODO:
};
FL_ASL.ProfileScraper.getGroupsMemberOf = function () {
    // TODO:
};
FL_ASL.ProfileScraper.getEventsGoingTo = function () {
    // TODO:
};
FL_ASL.ProfileScraper.getEventsMaybeGoingTo = function () {
    // TODO:
};

// This scrapes all data from a profile page
FL_ASL.scrapeProfile = function (user_id) {
    if (!window.location.pathname.endsWith(user_id)) {
        FL_ASL.log('Profile page does not match ' + user_id);
        return false;
    }
    var profile_data = {
        'user_id': user_id,
        'nickname': FL_ASL.ProfileScraper.getNickname(),
        'age': FL_ASL.ProfileScraper.getAge(),
        'gender': FL_ASL.ProfileScraper.getGender(),
        'role': FL_ASL.ProfileScraper.getRole(),
        'friend_count': FL_ASL.ProfileScraper.getFriendCount(),
        'paid_account': FL_ASL.ProfileScraper.isPaidAccount(),
        'location_locality': FL_ASL.ProfileScraper.getLocation().locality,
        'location_region': FL_ASL.ProfileScraper.getLocation().region,
        'location_country': FL_ASL.ProfileScraper.getLocation().country,
        'avatar_url': FL_ASL.ProfileScraper.getAvatar(),
        'sexual_orientation': FL_ASL.ProfileScraper.getSexualOrientation(),
        'interest_level': FL_ASL.ProfileScraper.getInterestLevel(),
        'looking_for': FL_ASL.ProfileScraper.getLookingFor(),
        'relationships': FL_ASL.ProfileScraper.getRelationships(),
        'ds_relationships': FL_ASL.ProfileScraper.getDsRelationships(),
        'bio': FL_ASL.ProfileScraper.getBio(),
        'websites': FL_ASL.ProfileScraper.getWebsites(),
        'last_activity': FL_ASL.ProfileScraper.getLastActivity(),
        'fetishes_into': FL_ASL.ProfileScraper.getFetishesInto(),
        'fetishes_curious_about': FL_ASL.ProfileScraper.getFetishesCuriousAbout(),
        'num_pics': FL_ASL.ProfileScraper.getPicturesCount(),
        'num_vids': FL_ASL.ProfileScraper.getVideosCount(),
        'latest_posts': FL_ASL.ProfileScraper.getLatestPosts(),
        'groups_lead': FL_ASL.ProfileScraper.getGroupsLead(),
        'groups_member_of': FL_ASL.ProfileScraper.getGroupsMemberOf(),
        'events_going_to': FL_ASL.ProfileScraper.getEventsGoingTo(),
        'events_maybe_going_to': FL_ASL.ProfileScraper.getEventsMaybeGoingTo()
    };
    return profile_data;
}

//This scrapes users in a list, for example: Groupmembers
FL_ASL.scrapeUserInList = function (node) {
    console.log("Scraping user from List");
    var loc_parts = jQuery(node).find('.fl-member-card__location').first().text().split(', ');
    var locality = ''; var region = ''; var country = '';
    if (2 === loc_parts.length) {
        // adds all countries to determine if something is a country or region
      var countries = ['Afghanistan', 'Aland', 'Islands', 'Albania', 'Algeria', 'American', 'Samoa', 'Andorra', 'Angola', 'Anguilla', 'Antarctica', 'Antigua', 'and', 'Barbuda', 'Argentina', 'Armenia', 'Aruba', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bermuda', 'Bhutan', 'Bolivia', 'Bonaire', 'Bosnia', 'and', 'Herzegovina', 'Botswana', 'Bouvet', 'Island', 'Brazil', 'British', 'Indian', 'Ocean', 'Territory', 'Brunei', 'Bulgaria', 'Burkina', 'Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Canary', 'Islands', 'Cape', 'Verde', 'Cayman', 'Islands', 'Central', 'African', 'Republic', 'Chad', 'Chile', 'China', 'Christmas', 'Island', 'Cocos', '(Keeling)', 'Islands', 'Colombia', 'Comoros', 'Congo,', 'Democratic', 'Republic', 'of', 'Congo,', 'Republic', 'of', 'Cook', 'Islands', 'Costa', 'Rica', 'Croatia', 'Cuba', 'Curacao', 'Cyprus', 'Czech', 'Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican', 'Republic', 'Ecuador', 'Egypt', 'El', 'Salvador', 'Equatorial', 'Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Falkland', 'Islands', 'Faroe', 'Islands', 'Fiji', 'Finland', 'France', 'French', 'Guiana', 'French', 'Polynesia', 'French', 'Southern', 'Lands', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Gibraltar', 'Greece', 'Greenland', 'Grenada', 'Guadeloupe', 'Guam', 'Guatemala', 'Guernsey', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Heard', 'Island', 'and', 'Mcdonald', 'Islands', 'Honduras', 'Hong', 'Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Isle', 'of', 'Man', 'Israel', 'Italy', 'Ivory', 'Coast', 'Jamaica', 'Japan', 'Jersey', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Lybia', 'Macao', 'Macedonia', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall', 'Islands', 'Martinique', 'Mauritania', 'Mauritius', 'Mayotte', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Montserrat', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'Netherlands', 'Antilles', 'New', 'Caledonia', 'New', 'Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'Niue', 'Norfolk', 'Island', 'North', 'Korea', 'Northern', 'Mariana', 'Islands', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua', 'New', 'Guinea', 'Paraguay', 'Peru', 'Philippines', 'Pitcairn', 'Poland', 'Portugal', 'Puerto', 'Rico', 'Qatar', 'Reunion', 'Romania', 'Russia', 'Rwanda', 'Saint', 'Barthélemy', 'Saint', 'Helena', 'Saint', 'Kitts', 'and', 'Nevis', 'Saint', 'Lucia', 'Saint', 'Martin', 'Saint', 'Pierre', 'and', 'Miquelon', 'Saint', 'Vincent', 'Samoa', 'San', 'Marino', 'São', 'Tomé', 'and', 'Príncipe', 'Saudi', 'Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra', 'Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon', 'Islands', 'Somalia', 'South', 'Africa', 'South', 'Georgia', 'and', 'the', 'South', 'Sandwich', 'Islands', 'South', 'Korea', 'South', 'Sudan', 'Spain', 'Sri', 'Lanka', 'Sudan', 'Suriname', 'Svalbard', 'and', 'Jan', 'Mayen', 'Swaziland', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tokelau', 'Tonga', 'Trinidad', 'and', 'Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Turks', 'and', 'Caicos', 'Islands', 'Tuvalu', 'Uganda', 'Ukraine', 'United', 'Arab', 'Emirates', 'United', 'Kingdom', 'United', 'States', 'United', 'States', 'Minor', 'Outlying', 'Islands', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican', 'City', 'Venezuela', 'Vietnam', 'Virgin', 'Islands,', 'British', 'Virgin', 'Islands,', 'U.S.', 'Wallis', 'and', 'Futuna', 'Western', 'Sahara', 'Yemen', 'Zambia', 'Zimbabwe'];
      // Fetlife code is dirty as heck, clean up the scraped data before processing
      loc_parts[1] = loc_parts[1].replace(/\n|\r/g, "").trim();
      loc_parts[0] = loc_parts[0].replace(/\n|\r/g, "").trim();
      // Check of the second part is a region or country
      if (countries.indexOf(loc_parts[1]) !== -1) {
        region = loc_parts[0];
        country = loc_parts[1];
      } else {
        locality = loc_parts[0];
        region = loc_parts[1];
      }
    }
    else if (1 === loc_parts.length) {
        country = loc_parts[0];
    }
    var profile_data = {
        'user_id': jQuery(node).find('a').first().attr('href').match(/\d+$/)[0],
        'nickname': jQuery(node).find('img').first().attr('alt'),
        'location_locality': locality.trim(),
        'location_region': region.trim(),
        'location_country': country.trim(),
        'avatar_url': jQuery(node).find('img').first().attr('src')
    };
    var member_info = jQuery(node).find('.fl-member-card__info').text().trim();
    if (member_info.match(/^\d+/) instanceof Array) {
        profile_data['age'] = member_info.match(/^\d+/)[0].trim();
    }
    if (member_info.match(/[^\d ]+/) instanceof Array) {
        profile_data['gender'] = member_info.match(/[^\d ]+/)[0].trim();
    }
    if (member_info.match(/ (.*)$/) instanceof Array) {
        profile_data['role'] = member_info.match(/ (.*)$/)[1].trim();
    }
    for (var k in profile_data) {
        if ('' === profile_data[k]) {
            delete profile_data[k];
        }
    }
    return profile_data;
};

//This scrapes users in a Other list, for example: Location lists
FL_ASL.scrapeUserInOtherList = function (node) {
    var loc_parts = jQuery(node).find('div.f6.lh-copy.fw4.silver.nowrap.truncate').first().text().split(', ');
    var locality = ''; var region = ''; var country = '';
    if (2 === loc_parts.length) {
        // adds all countries to determine if something is a country or region
      var countries = ['Afghanistan', 'Aland', 'Islands', 'Albania', 'Algeria', 'American', 'Samoa', 'Andorra', 'Angola', 'Anguilla', 'Antarctica', 'Antigua', 'and', 'Barbuda', 'Argentina', 'Armenia', 'Aruba', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bermuda', 'Bhutan', 'Bolivia', 'Bonaire', 'Bosnia', 'and', 'Herzegovina', 'Botswana', 'Bouvet', 'Island', 'Brazil', 'British', 'Indian', 'Ocean', 'Territory', 'Brunei', 'Bulgaria', 'Burkina', 'Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Canary', 'Islands', 'Cape', 'Verde', 'Cayman', 'Islands', 'Central', 'African', 'Republic', 'Chad', 'Chile', 'China', 'Christmas', 'Island', 'Cocos', '(Keeling)', 'Islands', 'Colombia', 'Comoros', 'Congo,', 'Democratic', 'Republic', 'of', 'Congo,', 'Republic', 'of', 'Cook', 'Islands', 'Costa', 'Rica', 'Croatia', 'Cuba', 'Curacao', 'Cyprus', 'Czech', 'Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican', 'Republic', 'Ecuador', 'Egypt', 'El', 'Salvador', 'Equatorial', 'Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Falkland', 'Islands', 'Faroe', 'Islands', 'Fiji', 'Finland', 'France', 'French', 'Guiana', 'French', 'Polynesia', 'French', 'Southern', 'Lands', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Gibraltar', 'Greece', 'Greenland', 'Grenada', 'Guadeloupe', 'Guam', 'Guatemala', 'Guernsey', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Heard', 'Island', 'and', 'Mcdonald', 'Islands', 'Honduras', 'Hong', 'Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Isle', 'of', 'Man', 'Israel', 'Italy', 'Ivory', 'Coast', 'Jamaica', 'Japan', 'Jersey', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Lybia', 'Macao', 'Macedonia', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall', 'Islands', 'Martinique', 'Mauritania', 'Mauritius', 'Mayotte', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Montserrat', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'Netherlands', 'Antilles', 'New', 'Caledonia', 'New', 'Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'Niue', 'Norfolk', 'Island', 'North', 'Korea', 'Northern', 'Mariana', 'Islands', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua', 'New', 'Guinea', 'Paraguay', 'Peru', 'Philippines', 'Pitcairn', 'Poland', 'Portugal', 'Puerto', 'Rico', 'Qatar', 'Reunion', 'Romania', 'Russia', 'Rwanda', 'Saint', 'Barthélemy', 'Saint', 'Helena', 'Saint', 'Kitts', 'and', 'Nevis', 'Saint', 'Lucia', 'Saint', 'Martin', 'Saint', 'Pierre', 'and', 'Miquelon', 'Saint', 'Vincent', 'Samoa', 'San', 'Marino', 'São', 'Tomé', 'and', 'Príncipe', 'Saudi', 'Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra', 'Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon', 'Islands', 'Somalia', 'South', 'Africa', 'South', 'Georgia', 'and', 'the', 'South', 'Sandwich', 'Islands', 'South', 'Korea', 'South', 'Sudan', 'Spain', 'Sri', 'Lanka', 'Sudan', 'Suriname', 'Svalbard', 'and', 'Jan', 'Mayen', 'Swaziland', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tokelau', 'Tonga', 'Trinidad', 'and', 'Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Turks', 'and', 'Caicos', 'Islands', 'Tuvalu', 'Uganda', 'Ukraine', 'United', 'Arab', 'Emirates', 'United', 'Kingdom', 'United', 'States', 'United', 'States', 'Minor', 'Outlying', 'Islands', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican', 'City', 'Venezuela', 'Vietnam', 'Virgin', 'Islands,', 'British', 'Virgin', 'Islands,', 'U.S.', 'Wallis', 'and', 'Futuna', 'Western', 'Sahara', 'Yemen', 'Zambia', 'Zimbabwe'];
      // Fetlife code is dirty as heck, clean up the scraped data before processing
      loc_parts[1] = loc_parts[1].replace(/\n|\r/g, "").trim();
      loc_parts[0] = loc_parts[0].replace(/\n|\r/g, "").trim();
      // Check of the second part is a region or country
      if (countries.indexOf(loc_parts[1]) !== -1) {
        region = loc_parts[0];
        country = loc_parts[1];
      } else {
        locality = loc_parts[0];
        region = loc_parts[1];
      }
    }
    else if (1 === loc_parts.length) {
        country = loc_parts[0];
    }
    var profile_data = {
        'user_id': jQuery(node).find('a').first().attr('href').match(/\d+$/)[0],
        'nickname': jQuery(node).find('a.link.span.f5.fw7.secondary').text().trim(),
        'location_locality': locality.trim(),
        'location_region': region.trim(),
        'location_country': country.trim(),
        'avatar_url': jQuery(node).find('img').first().attr('src')
    };
    var member_info = jQuery(node).find('span.f6.fw7.silver').text().trim();
    if (member_info.match(/^\d+/) instanceof Array) {
        profile_data['age'] = member_info.match(/^\d+/)[0].trim();
    }
    if (member_info.match(/[^\d ]+/) instanceof Array) {
        profile_data['gender'] = member_info.match(/[^\d ]+/)[0].trim();
    }
    if (member_info.match(/ (.*)$/) instanceof Array) {
        profile_data['role'] = member_info.match(/ (.*)$/)[1].trim();
    }
    for (var k in profile_data) {
        if ('' === profile_data[k]) {
            delete profile_data[k];
        }
    }
    return profile_data;
};


FL_ASL.scrapeAnchoredAvatar = function (node) {
    var profile_data = {
        'user_id': jQuery(node).parent().first().attr('href').match(/\d+$/)[0],
        'nickname': jQuery(node).first().attr('alt'),
        'avatar_url': jQuery(node).first().attr('src')
    };
    return profile_data;
};

// This is the main() function, executed on page load.
FL_ASL.main = function () {
    // Insert ASL search button interface at FetLife "Search" bar.
    FL_ASL.attachSearchForm();

    var fl_profiles = [];
    var m;
    //Determine of we are on a scrapable page
    if (m = window.location.pathname.match(/users\/(\d+)/)) {
        FL_ASL.log('Scraping profile ' + m[1]);
        fl_profiles.push(FL_ASL.scrapeProfile(m[1]));
    }
    if (document.querySelectorAll('.fl-member-card').length) {
        jQuery('.fl-member-card').each(function () {
            fl_profiles.push(FL_ASL.scrapeUserInList(this));
        });
    }
    if (document.querySelectorAll('div.pv2.pr3.pl2.mb2.br1').length) {
        jQuery('div.pv2.pr3.pl2.mb2.br1').each(function () {
            fl_profiles.push(FL_ASL.scrapeUserInOtherList(this));
        });
    }
    if (document.querySelectorAll('img.profile_avatar.avatar').length) {
        jQuery('img.profile_avatar.avatar').each(function () {
            fl_profiles.push(FL_ASL.scrapeAnchoredAvatar(this));
        });
    }
    FL_ASL.GAS.ajaxPost(fl_profiles);
};

// The following is required for Chrome compatibility, as we need "text/html" parsing.
/*
 * DOMParser HTML extension
 * 2012-09-04
 *
 * By Eli Grey, http://eligrey.com
 * Public domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*! @source https://gist.github.com/1129031 */
/*global document, DOMParser*/

(function(DOMParser) {
    "use strict";

    var
      DOMParser_proto = DOMParser.prototype
    , real_parseFromString = DOMParser_proto.parseFromString
    ;

    // Firefox/Opera/IE throw errors on unsupported types
    try {
        // WebKit returns null on unsupported types
        if ((new DOMParser).parseFromString("", "text/html")) {
            // text/html parsing is natively supported
            return;
        }
    } catch (ex) {}

    DOMParser_proto.parseFromString = function(markup, type) {
        if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
            var
              doc = document.implementation.createHTMLDocument("")
            ;

            doc.body.innerHTML = markup;
            return doc;
        } else {
            return real_parseFromString.apply(this, arguments);
        }
    };
}(DOMParser));
