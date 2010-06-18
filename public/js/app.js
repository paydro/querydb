var keyLogger = function(e){
    console.log("KeyPress");
    console.log("keyCode: " + e.keyCode);
    console.log("meta: " + e.metaKey);
    console.log("alt: " + e.altKey);
    console.log("ctrl: " + e.ctrlKey);
    console.log(e.target);
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

};

QueryBuilder = {
    columnName: function(element){
        var headerIndex = $(element).index() + 1;
        return $("thead tr th:nth-child(" + headerIndex + ")").text();
    },
    tableize: function(str){
        console.log(str);
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

var bindKeys = function(keyDefinition){
    var r = $("#results");

    for(key in keyDefinition){
        console.log("Binding " + key + " to " + keyDefinition[key]);
        r.bind(key, keyDefinition[key]);
    }
};


// ***************
// Onload function
// ***************
$(function(){
    hashes = new HashStack();

    bindKeys({
        // Focus on query textarea
        "/": function(){
            $("#query form textarea").focus();
            // Prevent "/" char appearing in textarea
            e.preventDefault();
        },

        // History navigation
        "n": function(){ window.location.hash = hashes.next() },
        "p": function(){ window.location.hash = hashes.prev() },

        // Table navigation
        "h": function(){ Navigator.moveLeft(); },
        "l": function(){ Navigator.moveRight(); },
        "j": function(){ Navigator.moveDown(); },
        "k": function(){ Navigator.moveUp(); },

        // Go to parent table for foreign key
        "<CR>": function(){ QueryBuilder.findParentRecord($("#results .selected")); },
    });

    // Make the body the focus on load to allow for keyboard interaction
    $("#results").focus();

    // Clicking form submit
    $("#query form").live("submit", function(){
        $("#query").trigger("query");
        return false;
    });

    // Apple + Enter to query
    $("#query form").live("keydown", function(e){
        if(e.keyCode == 13 && e.metaKey){
            $("#query").trigger("query");
        }
    });

    // ESC inside query box leaves focus - i.e., blur
    $("#query form textarea").live("keydown", function(e){
        if(e.keyCode == 27){
            $(this).blur();
            e.preventDefault();
        }
    });

    // Focus on query box with "/"
    $("body").live("keypress", function(e){
        keyLogger(e);
        var r = $("#results");

        if(e.target.nodeName.toLowerCase() == "textarea"){
            return; // Do nothing when inside the textarea
        }

        var keyTranslation = {
            13: "<CR>",
            47: "/",
            110: "n",
            112: "p",
            104: "h",
            108: "l",
            106: "j",
            107: "k",
        };
        switch(e.keyCode){
            // case 47: // "/"
                // $("#query form textarea").focus();
                // // Prevent "/" char appearing in textarea
                // e.preventDefault();
                // break;

            // // Parent lookup for foreign key
            // case 13:
                // QueryBuilder.findParentRecord($("#results .selected"));
                // break;

            default:
                console.log("Triggering: " + keyTranslation[e.keyCode]);
                r.trigger(keyTranslation[e.keyCode]);
                break;

            // NAVIGATION KEYS
            // case 110: // "n"
                // r.trigger("n");
                // // window.location.hash = hashes.next();
                // break;
            // case 112: // "p"
                // r.trigger("p");
                // // window.location.hash = hashes.prev();
                // break;
            // case 104: // "h"
                // r.trigger("h");
                // // Navigator.moveLeft();
                // break;
            // case 108: // "l"
                // r.trigger("l");
                // // Navigator.moveRight();
                // break;
            // case 106: // "j"
                // r.trigger("j");
                // // Navigator.moveDown();
                // break;
            // case 107: // "k"
                // r.trigger("k");
                // // Navigator.moveUp();
                // break;

        } // End switch statement
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
            },
            error: function(response){
                $("#results").html(response.responseText);
            }
        });
    });

    if(window.location.hash){
        $(window).trigger("hashchange");
    }

});
