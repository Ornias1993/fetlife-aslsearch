

//Actions executed when one clicks search
//TODO remove most of the progressbar code, now that it doesnt fill anymore?
console.log("JS loaded");

jQuery(document).ready(function () {
  jQuery('[data-toggle="popover"]').popover();
  jQuery('#search-form-submit').on('click', function () {
    jQuery(this).button('loading');
    jQuery('#donation-appeal').slideDown();
    jQuery('#search-progress').fadeIn()
      .find('.progress-bar')
      .removeClass('progress-bar-success');
    setProgressBar(500);
    jQuery('#search-form header, #search-form section').each(function () {
      jQuery(this).slideUp();
    });
    var form = document.getElementById('search-form');
    const formEntries = new FormData(form).entries();
    var json = Object.assign(...Array.from(formEntries, ([x,y]) => ({[x]:y})));
    json = JSON.stringify(json);
    console.log("json is " + encodeURIComponent(json));
    request("http://localhost:8081/query?" + json);
    //google.script.run
    //  .withSuccessHandler(handleSearchSuccess)
    //  .processSearchForm(json);
  });

  jQuery('#search-form select[name="user[type]"]').on('change', function () {
    if ('true' === jQuery(this).val()) {
      jQuery('#warning-about-paid-users').fadeIn(400, function () { jQuery(this).addClass('in'); });
    }
  });

  // Helper options for demographic buckets
  jQuery('#search-form .helper-opts .btn').each(function () {
    jQuery(this).on('click', function (clicked) {
      var btn_el = this;
      var checkbox = jQuery(this).find('[name^="helper-"]');
      if (checkbox.prop('checked')) { jQuery(this).addClass('active'); }
      jQuery(this).parent().find('.btn').each(function () {
        if (btn_el === this) { return; }
        if (jQuery(this).find('input').first().prop('checked')) {
          jQuery(this).addClass('active');
        } else {
          jQuery(this).removeClass('active');
        }
      });
      var field_set_name = checkbox.attr('name').split('-')[1];
      var field_set_vals = checkbox.val().split(',');
      jQuery('#search-form [name="' + field_set_name + '"]').each(function () {
        if (-1 !== jQuery.inArray(jQuery(this).val(), field_set_vals)) {
          jQuery(this).prop('checked', ((checkbox.prop('checked')) ? true : false));
        } else {
          jQuery(this).prop('checked', ((checkbox.prop('checked')) ? false : true));
        }
      });
      jQuery('#search-form [name="' + checkbox.attr('name') +'"]').each(function () {
        if (jQuery(this).val() !== jQuery(clicked.target).val()) {
          jQuery(this).prop('checked', false);
        }
      });
    });
  });

  jQuery('#donation-appeal > .close, #donation-appeal .btn-close').on('click', function() {
    jQuery(this).closest('#donation-appeal').slideUp({
      'complete': function () {
        jQuery(this).find('h2').text('Want moar? Support FetLife ASL Search!')
        jQuery(this).find('#search-progress').slideDown();
      }
    });
  });
});


// URL to be send via get and wait for response

function request(url) {
  const xhr = new XMLHttpRequest();
  xhr.timeout = 2000;
  xhr.onreadystatechange = function(e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
       // Code here for the server answer when successful
       console.log("Get Successfull: " + xhr.response);
      // handleSearchSuccess(xhr.response);
      } else {
       // Code here for the server answer when not successful
       console.log("Get FAILED");
      }
    }
  }
  xhr.ontimeout = function () {
    // Well, it took to long do some code here to handle that
    console.log("Get Timeout");
  }
  xhr.open('get', url, true)
  xhr.send();
}

//Behaviour of reset button
function resetSearchForm () {
  var form = jQuery('#search-form');
  form.find('[name="offset"]').val(0);
  form.find('#search-form-submit').text('Search');
  jQuery('#search-form header, #search-form section').each(function () {
    jQuery(this).slideDown();
  });
  var tbl = jQuery('#search-results');
  tbl.slideUp({
    'complete': function () {
      tbl.DataTable().destroy();
      tbl.html('');
      tbl.slideDown();
    }
  });
};

//Describes the progressbar changes if progressbar fill is used
//TODO remove now that we dont use progressbar fill?
function setProgressBar (n) {
  var bar = jQuery('#search-progress .progress-bar');
  var n = n || parseInt(bar.attr('aria-valuenow'));
  var x = n + 1;
  bar.width(x + '%');
  bar.attr('aria-valuenow', x);
  bar.find('.sr-only').text(x + '% Complete');
}

//Actions executed once search is finished. 
function handleSearchSuccess (results) {
  jQuery('#search-header-success')
    .fadeOut();
  jQuery('#search-progress .progress-bar')
    .addClass('progress-bar-success')
    .parent()
    .delay(2000)
    .fadeOut();
  jQuery('#search-form [name="offset"]').val(
    parseInt(jQuery('#search-form [name="offset"]').val()) + 10
  );

  updateFormUI();

  var columns = [];
  results[0].forEach(function (col_name) {
    var cell_funcs_map = {
      'nickname' : buildLinkToFetLife,
      'avatar_url': linkify
    };
    var c = {
      'title': col_name,
      'visible': true,
      'className': null,
      'createdCell': (undefined === cell_funcs_map[col_name]) ? null : cell_funcs_map[col_name]
    };
    if(c.title == "Locality"){
    c.title = "City";
    } 
    if(c.title == "Region"){
    c.title = "State/Province";
    } 
    columns.push(c);


    function getColClassName (col_name) {
      switch (col_name) {
        case 'Avatar URL':
          return 'none never';
        default:
          return 'none';
      }
    }
    function buildLinkToFetLife (td, cellData, rowData, row, col) {
      var html = '';
      html += '<a href="https://fetlife.com/users/' + rowData[0] + '" target="_blank">';
      html += '<img src="' + rowData[10] + '" alt="" class="img-rounded" /><div class="text-left">' + cellData + '</div>';
      html += '</a>';
      jQuery(td).html(html);
    }
    function linkify (td, cellData, rowData, row, col) {
      jQuery(td).html('<a href=' + rowData[10] + '"target="_blank">' + cellData + '</a>');
    }
    
  });

  // Add column for actions
  columns.push({
    'title': 'Actions',
    'orderable': false,
    'searchable': false,
    'className': 'all',
    //Right side buttons
    'data': function (row, type, set, meta) {
      var html = '<div class="search-result-actions btn-group btn-group-vertical">';
      html += '<a href="https://fetlife.com/conversations/new?with=' + row[0] + '" class="btn btn-success btn-xs" target="_blank">Message ' + row[1] + ' via FetLife</a>';
      html += '<a href="http://www.usersherlock.com/usersearch/' + row[1] + '" class="btn btn-info btn-xs" target="_blank">Find ' + row[1] + ' on other social networks</a>';
      if (row[10]) {
        html += '<form action="https://www.tineye.com/search" method="POST" target="_blank"><input type="hidden" name="url" value="' + row[10] + '" /><button type="submit" class="btn btn-info btn-xs" style="width:100%">Find ' + row[1] + '\'s profile pic on other sites</button></form>'
      }
      var report_url = 'mailto:caretakers@fetlife.com?SUBJECT=I want to report ';
      html += '<a href="' + report_url + row[1] + '&entry_0=' + row[0] + '&entry_1=' + row[1] + '" class="btn btn-danger btn-xs" target="_blank">Report ' + row[1] + ' to Caretakers</a>';
      html += '</div>';
      return html;
    }
  });

  //DataTable settings to use for results
  var dataset = results.slice(1);
  var table=('#search-results').empty
  table = jQuery('#search-results').DataTable({
    'destroy': true,
    'data': dataset,
    'columns': columns,
    'responsive': true,
    'dom': 'Bfrtip',
    'columnDefs': [
            {
                targets: 16,
                className: 'noVis'
            }
        ],
    'buttons': [
            {
                extend: 'colvis',
                columns: ':not(.noVis)'
            }, 
            'print', 
            {
            extend: 'excel',
            filename: 'ASLSearch'
            }, 
           'pdf'
    ],
    'language': {
      'search': 'Filter batch results:'
    }});
    
  //Default hide: UserID, Paid user, avatarurl and interestlevel
  table.column( 0 ).visible( false );
  table.column( 6 ).visible( false );
  table.column( 10 ).visible( false );
  table.column( 12 ).visible( false );
  
  function updateFormUI () {
    var offset = parseInt(jQuery('#search-form [name="offset"]').val());
    var limit = parseInt(jQuery('#search-form [name="limit"]').val());
    var batch_number = offset / limit;
    jQuery('#search-form-submit').data('complete-text', 'Show batch number ' + (batch_number + 1));
    jQuery('#search-form-submit').button('complete');
    jQuery('#search-results caption')
      .show()
      .html('Search results for batch number ' + batch_number);
  }
}
