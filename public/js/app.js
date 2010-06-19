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

var KeyManager = function(){
    var mappings = {};
    var state = "";

    var inState = function(){
        return state !== "";
    };

    var addState = function(s){
        state += s;
    };
    var setState = function(s){
        state = s;
    };

    // DEBUG
    this.defs = function(){
        return mappings;
    };
    this.showDefs = function(){
        console.log(mappings);
    };

    this.showState = function(){
        console.log(state);
    };
    // END DEBUG

    // Find function to call for a given key
    this.find = function(eventKey){
        if(inState()){
            return mappings["state-" + state][eventKey];
        }
        else {
            return mappings[eventKey];
        }
    };

    // <3 closures
    var stateSetFn = function(k){
        return (function(){
            addState(k);
        });
    };

    // Define key actions
    // TODO: Make it recursive to define multiple layers of namespaces
    this.define = function(definition){
        for(key in definition){
            if(typeof(definition[key]) === "object"){
                mappings[key] = stateSetFn(key);
                mappings["state-" + key] = definition[key];
            }
            else {
                mappings[key] = definition[key];
            }
        }
    };

    this.resetState = function(){
        setState("");
    }

};
var keyManager = new KeyManager();
keyManager.define({
    // Focus on query textarea
    "/": function(event){ $("#query form textarea").focus(); event.preventDefault(); },

    // History navigation
    "n": function(){ window.location.hash = hashes.next() },
    "p": function(){ window.location.hash = hashes.prev() },

    // Table navigation
    // NOTE: Need so that I don't have to create a function here, but just give it
    // the function name - i.e., Navigator.moveLeft. Navigator is using "this"
    // and when not inside a function like below, this means the element. FAIL.
    "h": function(){ Navigator.moveLeft(); },
    "l": function(){ Navigator.moveRight(); },
    "j": function(){ Navigator.moveDown(); },
    "k": function(){ Navigator.moveUp(); },
    "g": {
        // Not working yet
        // "g": {
            // "t": function() { console.log("double ggt"); },
        // },
        "t": function(){ console.log('go to table'); },
    },

    // Go to parent table for foreign key
    "<CR>": function(){ QueryBuilder.findParentRecord($("#results .selected")); },
});

var KeyTranslator = {
    isModifierPressed: function(e){
        // 13 = enter
        return (e.metaKey || e.ctrlKey || e.altKey || (e.keyCode === 13));
    },
    codeToKey: function(code, shift){
        if(shift){
            return KeyTranslator.upperCase[code];
        }
        else {
            return KeyTranslator.lowerCase[code];
        }
    },

    // Return an arrawy of modifier keys
    modifierKeys: function(e){
        var modifiers = [];
        // Ordering of modifiers is important
        if(e.altKey){
            modifiers.push("M");
        }
        if(e.ctrlKey){
            modifiers.push("C");
        }
        if(e.metaKey){
            modifiers.push("D");
        }
        return modifiers;
    },
    translate: function(e){
        var key;

        key = KeyTranslator.codeToKey(e.keyCode, e.shiftKey);
        if(KeyTranslator.isModifierPressed(e)){
           var modifiers = KeyTranslator.modifierKeys(e);
           modifiers.push(key);
           key = "<" + modifiers.join("-") + ">";
        }

        return key;
    },
    upperCase: {
        13: "CR",
        191: "?",
        78: "N",
        80: "P",
        72: "H",
        76: "L",
        74: "J",
        75: "K",
    },
    lowerCase: {
        13: "CR",
        191: "/",
        78: "n",
        80: "p",
        72: "h",
        76: "l",
        74: "j",
        75: "k",
        71: "g",
        84: "t",
    },
};

// ***************
// Onload function
// ***************
$(function(){
    hashes = new HashStack();

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

    // $("body").live("keydown", function(e){
        // keyLogger(e);
    // });
    // Focus on query box with "/"
    $("body").live("keydown", function(e){
        var r = $("#results");
        keyLogger(e);

        if(e.keyCode == 27){
            keyManager.resetState();
        }
        if(e.target.nodeName.toLowerCase() == "textarea"){
            return; // Do nothing when inside the textarea
        }

        // TODO: Remove this conditional when all keys are mapped
        var eventKey = KeyTranslator.translate(e);
        if(typeof eventKey !== "undefined"){
            var fn = keyManager.find(eventKey);
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
