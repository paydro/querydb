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
        var hashes = [];
        var ls = localStorage;
        for(i = 0; i < ls.length; i++){
            hashes[i] = ls.key(i);
        }

        // NOTE: localStorage stores items in an arbitrary order
        return hashes;
    },

};

var HashStack = function(){
    // Array of hashes
    var stack = [];
    var pointer = 0;

    // Load up stack
    stack = QueryStore.findAll();

    // Point to the last hash in the stack
    if(stack.length) {
        pointer = stack.length - 1;
    }

    this.next = function(){
        if(pointer == stack.length - 1){
            return stack[pointer];
        }
        else {
            return stack[++pointer];
        }
    };

    this.prev = function(){
        if(pointer == 0){
            return stack[pointer];
        }
        else {
            return stack[--pointer];
        }
    };

    this.push = function(hash){
        stack.push(hash);
        ++pointer;
    };
}

$(function(){
    hashes = new HashStack();

    // Make the body the focus on load to allow for keyboard interaction
    $("body").focus();

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
        // console.log("KeyPress");
        // console.log("keyCode: " + e.keyCode);
        // console.log("meta: " + e.metaKey);
        // console.log("alt: " + e.altKey);
        // console.log("ctrl: " + e.ctrlKey);
        // console.log(e.target);

        if(e.target.nodeName.toLowerCase() == "textarea"){
            return; // Do nothing when inside the textarea
        }

        switch(e.keyCode){
            case 47: // "/"
                $("#query form textarea").focus();
                e.preventDefault(); // Prevents a "/" char to appear in textarea
                break;

            case 110: // "n"
                window.location.hash = hashes.next();
                break;

            case 112: // "p"
                window.location.hash = hashes.prev();
                break;
        }

    });


    // Runs a new query
    $("body").bind("query", function(){
        var hash = QueryStore.push($("#query textarea").val())
        hashes.push(hash);
        window.location.hash = hash;
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
