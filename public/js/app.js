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
        $("#query form textarea").focus(); event.preventDefault();
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
    "g": {
        "t": function(e){
            $("#tables input[name=filter]").focus();
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
        sweetKeys.setContext("global");
    },
    "<CR>": function(e){
        // TODO: Temporary. Make <CR> run the query on the selected table
        var txt = $("#filter").blur().val();
        $("#query form #sql").text("SELECT * FROM " + txt + " LIMIT 100");
        $("#query form").submit();
        sweetKeys.resetContext();
        e.preventDefault();
    }
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

// ***************
// Onload function
// ***************
$(function(){
    hashes = new HashStack();

    // Make the body the focus on load to allow for keyboard interaction
    $("#results").focus();

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

    // ESC inside query box leaves focus - i.e., blur
    $("#query form textarea").live("keydown", function(e){
        if(e.keyCode == 27){
            $(this).blur();
            e.preventDefault();
        }
    });

    // Focus on query box with "/"
    // TODO: Move this function into SweetKeys
    $("body").live("keydown", function(e){
        keyLogger(e);

        // TODO: Remove this conditional when all keys are mapped
        var eventKey = SweetKeys.Translator.translate(e);
        if(typeof eventKey !== "undefined"){
            var fn = sweetKeys.find(eventKey);
            if(typeof fn !== "undefined"){ fn(e); }
        }
    });

    $("#results td").live("click", function(){
        Navigator.moveTo($(this));
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
