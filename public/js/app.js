var keyLogger = function(e){
    console.log("keyCode: " + e.keyCode);
    // console.log("meta: " + e.metaKey);
    // console.log("alt: " + e.altKey);
    // console.log("ctrl: " + e.ctrlKey);
    // console.log("shift: " + e.shiftKey);
    // console.log(e);
};

// Namespace for the app
var QDB = {
    Results: {
        selected: function(){ return $("#results td.selected"); },
        table: function(){ return $("#results") }
    },
    TableFilter: {
        selected: function(){ return $("#tables li.selected"); }
    },
    Query: {
        box: function(){ return $("#sql"); }
    }
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


var QueryBuilder = {
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
        $("#query form").submit();
    },
}


// ***************
// Onload function
// ***************
$(function(){
    QDB.hashes = new HashStack();

    // Form submit
    $("#query form").live("submit", function(){
        $("#query").trigger("query");
        return false;
    });

    // Clear history
    $("#query button").live("click", function(){
        QDB.hashes.clear();
        return false;
    });


    $("#query form textarea").keyLock({
        "<Esc>": function(){
            $("#sql").blur();
            return false;
        },
        "<D-CR>": function(){
            $("#query form").submit();
            return false;
        },
    });

    // Global key commands
    $("body").keyLock({
        // Focus on query textarea
        "/": function(event){
            $("#query form textarea").focus().select();
            event.preventDefault();
        },

        // History navigation
        "n": function(){ window.location.hash = QDB.hashes.next() },
        "p": function(){ window.location.hash = QDB.hashes.prev() },

        // Table navigation
        // TODO: Change so that I don't have to create a function here,
        // but just give it the function name - i.e., Navigator.moveLeft.
        // Navigator is using "this" and when not inside a function like below,
        // this means the element.
        "h": function(){ Navigator.moveLeft(); },
        "l": function(){ Navigator.moveRight(); },
        "j": function(){ Navigator.moveDown(); },
        "k": function(){ Navigator.moveUp(); },

        // Focus on the tables pane
        "g": {
            "t": function(e){
                $("#tables input[name=filter]").focus().select();
                e.preventDefault();
            },
        },

        // Go to parent table for foreign key
        "<CR>": function(){
            QueryBuilder.findParentRecord($("#results .selected"));
        },
    }, true);

    $("#filter").keyLock({
        "<Esc>": function(){
            $("#tables input[name=filter]").blur();
            return false;
        },
        "<CR>": function(e){
            // TODO: Temporary. Make <CR> run the query on the selected table
            var txt = $("#tables li.selected").text().trim();
            $("#filter").blur();
            $("#query form #sql").text("SELECT * FROM " + txt + " LIMIT 100");
            $("#query form").submit();
            return false;
        },
        "<A-DOWN>": function(e){
            var selected = $("#tables ul li.selected")
            var next = selected.nextAll("li:visible:first");
            if(next.length){
                selected.removeClass("selected");
                next.addClass("selected");
            }
            return false;
        },
        "<A-UP>": function(e){
            var selected = $("#tables ul li.selected")
            var prev = selected.prevAll("li:visible:first");
            if(prev.length){
                selected.removeClass("selected");
                prev.addClass("selected");
            }
            return false;
        },
    });

    $("#filter").liveUpdate($("#tables ul"));

    $("#results td").live("click", function(){
        Navigator.moveTo($(this));
    });

    // Runs a new query
    $("body").bind("query", function(){
        var hash = QueryStore.push($("#query textarea").val())
        QDB.hashes.push(hash);
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
