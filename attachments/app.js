$(function() {
  'use strict';

  var days = {};

  function getDay(date) {
    return days[date.getFullYear()][date.getMonth()][date.getDate()];
  }

  function trailing(s) {
    return ((s.length == 4) ? '0' : '') + s;
  }

  (function setupTimeline() {
    var months = 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(',');
    var day = [2011, 8, 5];
    var n = 0;
    var today = new Date(new Date().getFullYear(), new Date().getMonth(),
      new Date().getDate());
    var past = true;
    var month = -1;

    function addWeek(year, week) {
      var weekElt = $('<div class=week>').attr('id', 'week-' + year + '-' + i)
        .appendTo('.timeline');
      $('<h1>').text(week).appendTo(weekElt);
      var dayCont = $('<div class=days>').appendTo(weekElt);
      for (var i = 0; i < 7; i++) {
        var dayElt = $('<div class=day>').appendTo(dayCont);
        var date = new Date(day[0], day[1], day[2] + n++);

        (function() {
          var y = date.getFullYear();
          var m = date.getMonth();
          var d = date.getDate();
          if (!days[y]) days[y] = {};
          if (!days[y][m]) days[y][m] = {};
          days[y][m][d] = dayElt.get(0);
        })();

        var label = $('<div class=label>').appendTo(dayElt);
        $('<span class=day>').text(date.getDate()).appendTo(label);

        if (month != date.getMonth()) {
          $('<span class=month>').text(months[date.getMonth()]).appendTo(label);
          month = date.getMonth();
        }

        if (date.getTime() == today.getTime()) {
          past = false;
          dayElt.addClass('today');
          weekElt.addClass('current');
        }
        if (past) {
          dayElt.addClass('past');
          if (i == 6) weekElt.addClass('past');
        }
        if (i == 5 || i == 6) dayElt.addClass('weekend');
        if (week == 52 || week == 1) dayElt.addClass('holiday');
      }
    }

    for (var i = 36; i <= 52; i++) addWeek(2011, i);
    for (var i = 1; i <= 4; i++) addWeek(2012, i);
  })();

  function addItem(id, item) {
    function toDate(s) {
      return new Date(
        parseInt(s.substr(0, 4)),
        parseInt(s.substr(5, 2), 10) - 1,
        parseInt(s.substr(8, 2), 10)
      );
    }

    var date = toDate(item.date);

    var elt = $('<div class=item>')
      .appendTo(getDay(date))
      .addClass('type-' + item.type)
      .attr('title', item.name)
      .click(showDetails)
      .data('id', id);
    $('<h2>').text(item.name).appendTo(elt);

    if (item.title) $('<p class=title>').text(item.title).appendTo(elt);

    $('<p class=time>').text(item.from + '–' + item.to).appendTo(elt);

    if (item.deliverable)
      $('<p class=deliverable>').text(item.deliverable).appendTo(elt);
  }

  $('button[name=new]').click(function() {
    $('.popup').data('doc', null).show();
    $('.popup input, .popup select, .popup textarea').val('');
  });

  function showDetails() {
    var id = $(this).data('id');
    $.get('api/' + id, function(data) {
      var doc = JSON.parse(data);

      $('.popup').data('doc', doc).show();
      $('.popup [name=id]').val(id);
      $('.popup [name=name]').val(doc.name);
      $('.popup [name=type]').val(doc.type);
      if (doc.deadline) {
        var deadline = doc.deadline.split(' ');
        $('.popup [name=deadline]').val(deadline[0] + 'T' +
          trailing(deadline[1]));
      } else {
        $('.popup [name=deadline]').val('');
      }
      $('.popup [name=deliverable]').val(doc.deliverable || '');
      var moments = [];
      $(doc.moments).each(function(i, moment) {
        moments.push([
          moment.date,
          moment.from,
          moment.to,
          moment.deliverable || ''
        ].join(' ').replace(/^\s+|\s+$/, ''));
      });
      $('.popup [name=moments]').val(moments.join('\n'));
    });
  }

  $('.popup').hide();

  $('.popup button[name=cancel]').click(function() {
    $('.popup').hide();
  });

  $('.popup button[name=save]').click(function() {
    var doc = $('.popup').data('doc') || {};
    var id = $('.popup [name=id]').val();

    doc.name = $('.popup [name=name]').val();
    doc.type = $('.popup [name=type]').val();
    var deadline = $('.popup [name=deadline]').val();
    if (deadline) {
      var split = deadline.split('T');
      doc.deadline = split[0] + ' '+ split[1].replace(/^0/, '');
    }
    var deliverable = $('.popup [name=deliverable]').val();
    if (deliverable) doc.deliverable = deliverable;
    doc.moments = [];
    $($('.popup [name=moments]').val().split('\n')).each(function(i, moment) {
      moment = moment.split(' ');
      var obj = {
        date: moment[0],
        from: moment[1],
        to: moment[2]
      };
      if (moment.length > 3) {
        obj.deliverable = moment.slice(3).join(' ');
      }
      doc.moments.push(obj);
    });

    if (id) {
      $.ajax({
        url: 'api/' + id,
        type: 'PUT',
        data: JSON.stringify(doc),
        processData: false,
        success: function() {
          $('.popup').hide();
          loadItems();
        }
      });
    } else {
      $.ajax({
        url: 'api/',
        type: 'POST',
        data: JSON.stringify(doc),
        processData: false,
        contentType: 'application/json',
        success: function() {
          $('.popup').hide();
          loadItems();
        }
      });
    }
  });

  $('input[name=compact]').change(function() {
    $('.timeline').toggleClass('compact', this.checked);
  });

  function loadItems() {
    $.get('api/_design/app/_view/by_date', function(data) {
      var scrollTo = $('.timeline-wrapper').scrollLeft() || 0;
      $('.timeline div.day').html('');
      $(JSON.parse(data).rows).each(function(i, row) {
        addItem(row.id, row.value);
      });
      if (!scrollTo) scrollTo = $('.week.current').offset().left - 128;
      $('.timeline-wrapper').scrollLeft(scrollTo);
    });
  }

  loadItems();

  $.get('api/_design/app/_view/types?group=true', function(data) {
    $(JSON.parse(data).rows).each(function(i, row) {
      var label = $('<label>').text(' '  + row.key + ' (' + row.value + ')')
        .appendTo($('<li>').addClass('type-' + row.key).appendTo('.types'));
      $('<input type=checkbox checked>').attr('value', row.key)
        .prependTo(label);

      $('<option>').text(row.key).appendTo('.popup [name=type]');
    });
    $('.types input').change(function() {
      $('.timeline .type-' + this.value).toggleClass('hidden');
    });
  });

  var label = $('<label>').text(' deliverables')
    .appendTo($('<p>').appendTo('.controls'));
  $('<input type=checkbox checked>').prependTo(label).change(function() {
    $('.deliverable').toggleClass('hidden');
  });
});
