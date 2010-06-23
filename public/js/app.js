var keyLogger = function(e){
    // console.log("KeyPress");
    console.log("keyCode: " + e.keyCode);
    // console.log("meta: " + e.metaKey);
    // console.log("alt: " + e.altKey);
    // console.log("ctrl: " + e.ctrlKey);
    // console.log("shift: " + e.shiftKey);
    // console.log(e);
};

var QueryStore = {
    push: function(query){
        hash = "#" + $.sha1(query);
        localStorage.setItem(hash, query);
        return hash;
    },
    find: function(hash){
        return localStorage.getItem(hash);
    },
    findAll: function(){
        // NOTE: localStorage stores items in an arbitrary order
        var hashes = [];
        var ls = localStorage;
        for(i = 0; i < ls.length; i++){
            hashes[i] = ls.key(i);
        }

        return hashes;
    },
    clear: function(){
        localStorage.clear();
    },
};



QueryBuilder = {
    columnName: function(element){
        var headerIndex = $(element).index() + 1;
        return $("thead tr th:nth-child(" + headerIndex + ")").text();
    },
    tableize: function(str){
        return str.replace(/_id/, "s");
    },
    findParentRecord: function(element){
        var header = this.columnName(element);

        var query = "SELECT * \n" +
                    "FROM " + this.tableize(header) + "\n" +
                    "WHERE id = " + element.text().trim();
        $("form textarea").text(query);
        $("#query").trigger("query");
    },
}

var sweetKeys = new SweetKeys();
// Global context
sweetKeys.define({
    // Focus on query textarea
    "/": function(event){
        $("#query form textarea").focus().select();
        event.preventDefault();
        sweetKeys.setContext("query");
    },

    // History navigation
    "n": function(){ window.location.hash = hashes.next() },
    "p": function(){ window.location.hash = hashes.prev() },

    // Table navigation
    // TODO: Change so that I don't have to create a function here,
    // but just give it the function name - i.e., Navigator.moveLeft.
    // Navigator is using "this" and when not inside a function like below,
    // this means the element. FAIL.
    "h": function(){ Navigator.moveLeft(); },
    "l": function(){ Navigator.moveRight(); },
    "j": function(){ Navigator.moveDown(); },
    "k": function(){ Navigator.moveUp(); },

    // Focus on the tables pane
    "g": {
        "t": function(e){
            $("#tables input[name=filter]").focus().select();
            sweetKeys.setContext("tables");
            e.preventDefault();
        },
    },

    // Go to parent table for foreign key
    "<CR>": function(){
        QueryBuilder.findParentRecord($("#results .selected"));
    },
});

sweetKeys.define("tables", {
    "<Esc>": function(){
        $("#tables input[name=filter]").blur();
        sweetKeys.resetContext();
    },
    "<CR>": function(e){
        // TODO: Temporary. Make <CR> run the query on the selected table
        var txt = $("#tables li.selected").text().trim();
        $("#filter").blur();
        $("#query form #sql").text("SELECT * FROM " + txt + " LIMIT 100");
        $("#query form").submit();
        e.preventDefault();
    },
    "<A-DOWN>": function(e){
        var selected = $("#tables ul li.selected")
        var next = selected.nextAll("li:visible:first");
        if(next.length){
           selected.removeClass("selected");
           next.addClass("selected");
        }
        e.preventDefault();
    },
    "<A-UP>": function(e){
        var selected = $("#tables ul li.selected")
        var prev = selected.prevAll("li:visible:first");
        if(prev.length){
           selected.removeClass("selected");
           prev.addClass("selected");
        }
    },
});

sweetKeys.define("query", {
    "<Esc>": function(){
        $("#sql").blur();
        sweetKeys.resetContext();
    },
    "<D-CR>": function(){
        $("#query form").submit();
    },
});


jQuery.fn.liveUpdate = function(list){
  list = jQuery(list);
  if (list.length) {
      console.log("here");
    var rows = list.children('li'),
      cache = rows.map(function(){
        return this.innerHTML.toLowerCase();
      });

    // Note filter happens on key up since we want the character
    // to be inserted before running the filter
    this.live("keyup", function(e){
        var fn = sweetKeys.findFunc(e);
        if(typeof fn !== "undefined"){
            console.log("do stuff");
            e.preventDefault();
        }
        else {
            filter.apply(this);
            console.log("do normal thing");
        }
    }).keyup();
  }

  return this;

  function filter(){
    var term = jQuery.trim(jQuery(this).val().toLowerCase()), scores = [];

    rows.removeClass("selected");

    if (!term) {
      rows.show();
    } else {
      rows.hide();

      cache.each(function(i){
        var score = this.score(term);
        if (score > 0) { scores.push([score, i]); }
      });

      jQuery.each(scores.sort(function(a, b){return b[0] - a[0];}), function(){
        jQuery(rows[ this[1] ]).show();
      });
    }

    rows.filter(":visible:first").addClass("selected");
  }
};

// ***************
// Onload function
// ***************
$(function(){
    hashes = new HashStack();

    $("#filter").liveUpdate($("#tables ul"));

    // Form submit
    $("#query form").live("submit", function(){
        $("#query").trigger("query");
        return false;
    });

    // Clear history
    $("#query button").live("click", function(){
        hashes.clear();
        return false;
    });

    // Query box focusing/keys
    $("#query form textarea").live("keydown", function(e){
        sweetKeys.trigger(e);
    }).live("focus", function(){
        sweetKeys.setContext("query");
    });

    // TODO: This is very global. All keys pressed get run. Maybe
    // reduce the scope?
    $("body").live("keydown", function(e){
        keyLogger(e);
        if(sweetKeys.isGlobalContext()){
            console.log("global context executing");
            sweetKeys.trigger(e);
        }
    });

    $("#filter").live("keydown", function(e){
        sweetKeys.trigger(e);
    }).live("click", function(e){
        sweetKeys.setContext("tables");
    });

    $("#results td").live("click", function(){
        Navigator.moveTo($(this));
        sweetKeys.resetContext();
    });

    // Runs a new query
    $("body").bind("query", function(){
        var hash = QueryStore.push($("#query textarea").val())
        hashes.push(hash);
        window.location.hash = hash;
        $("#query form textarea").blur();
    });

    $(window).bind("hashchange", function(e){
        var form = $("#query form");
        var query = QueryStore.find(window.location.hash);

        $("#query textarea").val(query);
        $.ajax({
            url: form.attr("action"),
            data: {"sql": query},
            type: "POST",
            success: function(html){
                $("#results").html(html);
                // Allow for movement!
                $("#results td:first").addClass("selected");
                Scroller.scrollToStart();
                // Put context back on the results after a query executes
                sweetKeys.resetContext();
            },
            error: function(response){
                $("#results").html(response.responseText);
            }
        });
    });

    $("#tables li").live("click", function(){
        var table = $(this).text().trim();
        $("#query form #sql").text("SELECT * FROM " + table + " LIMIT 100");
        $("#query form").submit();
        return false;
    });

    if(window.location.hash){
        $(window).trigger("hashchange");
    }

});
