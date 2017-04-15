$(function() {
  var socket = io();
  var $log = $('#log');
  var $clear = $('#clear');

  
  /**
   * Inital load
   */
  $.ajax({ url: '/list', }).done(function(entries) {

    if (entries.length === 0) {
      return;
    }

    $log.html('');

    for (var i = 0; i < entries.length; i++) {
      addEntry(entries[i]);
    }
  });


  /**
   * add new lines on "entry"
   */
  socket.on('entry', function(entry) {
    addEntry(entry, true);
  });

  /**
   * Remove entries on "clear"
   */
  socket.on('clear', function(data) {
    $log.html('');
  });

  /**
   * Show error on "error"
   */
  socket.on('error', function(data)  {
    var error = data.error;

    addEntry({
      id: 'Error',
      text: error.replace('Error:', '').trim(),
      error: true
    }, true);
  });

  /**
   * Function to add in new entries
   */
  function addEntry(entry, isNew) {
    var id = (entry.id || '');
    var entryHTML = '<a id="'+id+'" href="#'+id+'" class="entry'+(!!isNew ? ' entry--new' : '')+(!!entry.error ? ' entry--error' : '')+'">'+
      '<div class="entry__row">'+
        '<div class="entry__id">'+id+'</div>'+
        '<div class="entry__text">'+entry.text+'</div>'+
      '</div>'+
      ( entry.created_at ? '<div class="entry__timestamp">'+entry.created_at+'</div>' : '' )
    '</a>';
  
    $log.prepend(entryHTML);
  }
});
