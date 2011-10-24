 var couchapp = require('couchapp')
  , path = require('path')
  ;

ddoc = 
  { _id:'_design/app'
  , rewrites : 
    [ {from:"/", to:'index.html'}
    , {from:"/api", to:'../../'}
    , {from:"/api/*", to:'../../*'}
    , {from:"/*", to:'*'}
    ]
  }
  ;

ddoc.views = {};

ddoc.views.items = {
  map: function(doc) {
    if (doc._id.indexOf('_design/') != 0) emit(doc.name, null);
  }
};

ddoc.views.types = {
  map: function(doc) {
    if (doc.type && doc.moments) emit(doc.type, doc.moments.length);
  },
  reduce: function(keys, values, rereduce) {
    return sum(values);
  }
};

ddoc.views.by_date = {
  map: function(doc) {
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
  }
};

ddoc.validate_doc_update = function (newDoc, oldDoc, userCtx) {   
  if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1) {
    throw "Only admin can delete documents on this database.";
  } 
}

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;
