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
        input: function(){ return $("#filter"); },
        selected: function(){ return $("#tables li.selected"); }
    },
    Query: {
        form: function() { return $("#query form"); },
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
        QDB.Query.box().text(query);
        QDB.Query.form().submit();
    },
}


var adjustSize = function(){
    $("#right-panel").width($(window).width() - $("#left-panel").width());
    $("#results-container").height($(window).height() - $("#query").height());
};
$(window).resize(adjustSize);

// ***************
// Onload function
// ***************
$(function(){
    adjustSize();

    QDB.hashes = new HashStack();

    // Form submit
    QDB.Query.form().live("submit", function(){
        $("#query").trigger("query");
        return false;
    });

    // Clear history
    $("#query button").live("click", function(){
        QDB.hashes.clear();
        return false;
    });


    QDB.Query.box().keyLock({
        "<Esc>": function(){
            QDB.Query.box().blur();
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
                QDB.TableFilter.input().focus().select();
                e.preventDefault();
            },
        },

        // Go to parent table for foreign key
        "<CR>": function(){
            QueryBuilder.findParentRecord(QDB.Results.selected());
        },
    });

    QDB.TableFilter.input().keyLock({
        "<Esc>": function(){
            QDB.TableFilter.input().blur();
            return false;
        },
        "<CR>": function(e){
            // TODO: Temporary. Make <CR> run the query on the selected table
            var txt = QDB.TableFilter.selected().text().trim();
            QDB.TableFilter.input().blur();
            QDB.Query.box().text("SELECT * FROM " + txt + " LIMIT 100");
            QDB.Query.form().submit();
            return false;
        },
        "<A-DOWN>": function(e){
            var selected = QDB.TableFilter.selected();
            var next = selected.nextAll("li:visible:first");
            if(next.length){
                selected.removeClass("selected");
                next.addClass("selected");
            }
            return false;
        },
        "<A-UP>": function(e){
            var selected = QDB.TableFilter.selected();
            var prev = selected.prevAll("li:visible:first");
            if(prev.length){
                selected.removeClass("selected");
                prev.addClass("selected");
            }
            return false;
        },
    });

    QDB.TableFilter.input().liveUpdate($("#tables ul"));

    $("#results td").live("click", function(){
        Navigator.moveTo($(this));
    });

    // Runs a new query
    $("body").bind("query", function(){
        var hash = QueryStore.push($("#query textarea").val())
        QDB.hashes.push(hash);
        window.location.hash = hash;
        QDB.Query.box().blur();
    });

    $(window).bind("hashchange", function(e){
        var form = QDB.Query.form();
        var query = QueryStore.find(window.location.hash);

        QDB.Query.box().val(query);
        $.ajax({
            url: form.attr("action"),
            data: {"sql": query},
            type: "POST",
            success: function(html){
                QDB.Results.table().html(html);
                // Allow for movement!
                $("#results td:first").addClass("selected");
                Scroller.scrollToStart();
            },
            error: function(response){
                QDB.Results.table().html(response.responseText);
            }
        });
    });

    $("#tables li").live("click", function(){
        var table = $(this).text().trim();
        QDB.Query.box().text("SELECT * FROM " + table + " LIMIT 100");
        QDB.Query.form().submit();
        return false;
    });

    if(window.location.hash){
        $(window).trigger("hashchange");
    }

});
