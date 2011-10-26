function $(query) {
  return document.querySelector(query);
}

function $$(query) {
  var results = document.querySelectorAll(query);
  results.map = function(fun) {
    for (var i = 0; i < results.length; i++) {
      fun(results[i]);
    }
  };
  return results;
}

function get(url, callback) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.onreadystatechange = function() {
    if (request.readyState == 4) {
      var json = JSON.parse(request.responseText);
      callback(json);
    }
  };
  request.send(null);
}

function init() {
  loadFunctions();

  $('button.preview').onclick = preview;
  $('button.apply').onclick = apply;
}

function preview() {
  $('.status').innerHTML = 'Previewing...';

  try {
    var fun = new Function('doc', '(' + $('.function').value + ')(doc)');
  } catch (err) {
    $('.status').innerHTML = 'Error: ' + err;
    console.log(err);
    return;
  }

  get('api/_all_docs?include_docs=true', function(json) {
    change = [];

    json.rows.map(function(row) {
      fun(row.doc);
    });

    $('.docs').innerHTML = '';
    change.map(function(doc) {
      $('.docs').innerHTML += '<li>' + (doc.movie || doc._id);
    });

    $('.status').innerHTML = 'Look at the preview!';
  });
};

function apply() {
  $('.status').innerHTML = 'Applying...';

  var request = new XMLHttpRequest();
  request.open('POST', 'api/_bulk_docs', true);
  request.onreadystatechange = function() {
    if (request.readyState == 4) {
      $('.status').innerHTML = 'Applied!';
    }
  };
  request.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
  request.send(JSON.stringify({ docs: change }));
}

function loadFunctions() {
  functions.map(function(fun) {
    $('.load').innerHTML += '<option>' + fun.title;
  });
  $('.load').onchange = function() {
    $('.function').innerHTML = functions[$('.load').selectedIndex].script.toString();
  };
  $('.load').onchange();
}

function save(doc) {
  change.push(doc);
}

var change = [];

var functions = [
  {
    title: 'Do nothing but re-save all docs',
    script: function(doc) {
  save(doc);
}
  },
  {
    title: 'Rename tag',
    script: function(doc) {
  var from = 'aap';
  var to = 'noot';
  if (doc.movie && doc.tags) {
    var index = doc.tags.indexOf(from);
    if (index != -1) {
      doc.tags[index] = to;
      save(doc);
    }
  }
}
  }/*,
  {
    title: 'Save as separate items',
    script: function(doc) {
  v
  function trailing(s) {
    return ((s.length == 4) ? '0' : '') + s;
  }
  if (doc.moments) {
    doc.moments.forEach(function(moment, i) {
      var value = {
        date: moment.date,
        from: moment.from,
        to: moment.to,
        name: doc.name,
        type: doc.type,
        deliverable: doc.deliverable
      };
      if (moment.title) value.title = moment.title;
      if (doc.deliverable && i == doc.moments.length - 1)
        value.deliverable = doc.deliverable;
      if (moment.deliverable) value.deliverable = moment.deliverable;
      emit([moment.date, trailing(moment.from)], value);
    });
  } else if (doc.start && doc.end) {
    emit(doc.start, doc.name);
  }
  */
}
];
