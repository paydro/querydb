var keyLogger = function(e){
    console.log("keyCode: " + e.keyCode);
    // console.log("meta: " + e.metaKey);
    // console.log("alt: " + e.altKey);
    // console.log("ctrl: " + e.ctrlKey);
    // console.log("shift: " + e.shiftKey);
    // console.log(e);
};

var Results = {
    curCell: function() { return $("#results td.selected"); },
    container: function() { return $("#results"); }
};

var Table = {
    filterBox: function() { return $("#filter"); },
    curSelected: function() { return $("#tables li.selected"); }
};

var Sql = {
    textBox: function () { return $("#sql"); },
    form: function () { return $("#query form"); }
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
        Sql.textBox().text(query);
        Sql.form().submit();
    },
}


// ***************
// Onload function
// ***************
$(function(){
    hashes = new HashStack();

    // Form submit
    Sql.form().live("submit", function(){
        $("#query").trigger("query");
        return false;
    });

    // Clear history
    $("#query button").live("click", function(){
        hashes.clear();
        return false;
    });


    Sql.textBox().keyLock({
        "<Esc>": function(){
            Sql.textBox().blur();
            return false;
        },
        "<D-CR>": function(){
            $("#query form").submit();
            return false;
        },
    });

    // Global key commands
    $("body").keyLock({
        // History navigation
        "n": function(){ window.location.hash = hashes.next() },
        "p": function(){ window.location.hash = hashes.prev() },

        // Table navigation
        // TODO: Change so that I don't have to create a function here,
        // but just give it the function name - i.e., Navigator.moveLeft.
        // Navigator is using "this" and when not inside a function like below,
        // this means the element.
        "h": function(){ Navigator.moveLeft(); },
        "l": function(){ Navigator.moveRight(); },
        "j": function(){ Navigator.moveDown(); },
        "k": function(){ Navigator.moveUp(); },

        // Go-to key bindings
        "g": {
            "t": function(e){
                Table.filterBox().focus().select();
                return false;
            },

            "s": function(e){
                Sql.textBox().focus().select();
                return false;
            },

            "p": function(e){
                QueryBuilder.findParentRecord(Results.curCell());
                return false;
            },
        },
    });

    // Key commands for filtering tables
    Table.filterBox().keyLock({
        "<Esc>": function(){
            Table.filterBox().blur();
            return false;
        },
        "<CR>": function(e){
            // TODO: Temporary. Make <CR> run the query on the selected table
            var txt = Table.curSelected().text().trim();
            Table.filterBox().blur();
            Sql.textBox().text("SELECT * FROM " + txt + " LIMIT 100");
            Sql.form().submit();
            return false;
        },
        "<A-DOWN>": function(e){
            var selected = Table.curSelected();
            var next = selected.nextAll("li:visible:first");
            if(next.length){
                selected.removeClass("selected");
                next.addClass("selected");
            }
            return false;
        },
        "<A-UP>": function(e){
            var selected = Table.curSelected();
            var prev = selected.prevAll("li:visible:first");
            if(prev.length){
                selected.removeClass("selected");
                prev.addClass("selected");
            }
            return false;
        },
    });

    Table.filterBox().liveUpdate($("#tables ul"));

    // Clicking on a table cell highlights that cell
    $("#results td").live("click", function(){
        Navigator.moveTo($(this));
    });

    // Runs a new query
    $("body").bind("query", function(){
        var hash = QueryStore.push($("#query textarea").val())
        hashes.push(hash);
        window.location.hash = hash;
        Sql.textBox().blur();
    });

    $(window).bind("hashchange", function(e){
        var form = Sql.form();
        var query = QueryStore.find(window.location.hash);

        Sql.textBox().val(query);
        $.ajax({
            url: form.attr("action"),
            data: {"sql": query},
            type: "POST",
            dataType: "json",
            success: function(json){
                console.log("State object:");
                console.log(json);
                Results.container().html(json["html"]);
                $("#results td:first").addClass("selected");
                Scroller.scrollToStart();
            },
            error: function(response){
                // TODO: Change into a flash-type message rather
                // than displaying within the results area
                Results.container().html(response.responseText);
            }
        });
    });

    $("#tables li").live("click", function(){
        var table = $(this).text().trim();
        Sql.textBox().text("SELECT * FROM " + table + " LIMIT 100");
        Sql.form().submit();
        return false;
    });

    if(window.location.hash){
        $(window).trigger("hashchange");
    }

});
