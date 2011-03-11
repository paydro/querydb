var TableList = function(selector){
    var element = $(selector);
    var list = element.find("ul");
    var filterBox = element.find("#filter");
    var that = this;

    // Initialize jQuery elements
    (function(){
        
        var selectNext = function(){
            var selected = that.selected();
            var next = selected.nextAll("li:visible:first");
            if(next.length){
                selected.removeClass("selected");
                next.addClass("selected");
            }
            return false;
        };

        var selectPrev = function(){
            var selected = that.selected();
            var prev = selected.prevAll("li:visible:first");
            if(prev.length){
                selected.removeClass("selected");
                prev.addClass("selected");
            }
            return false;
        };

        // Initialize keybindings
        filterBox.keylock({
            "<Esc>": function(){
                that.blur();
                return false;
            },
            "<CR>": function(e){
                $(document).trigger("browsetable", that.selectedTableName());
                return false;
            },
            "<A-DOWN>": selectNext, 
            "<A-UP>": selectPrev,
        });

        // Allow live filter in the filter box
        filterBox.liveUpdate(element.find("ul"));

        list.find("li a").live("click", function(){
            app.tables.select($(this).parent());
            $(document).trigger("browsetable", app.tables.selectedTableName());
            return false;
        });
    })();

    this.focus = function(){
        filterBox.focus().select();
    };

    this.blur = function(){
        filterBox.blur();
    };

    this.select = function(el) {
        list.find(".selected").removeClass("selected");
        el.addClass("selected")
    };

    this.selected = function(){
        return element.find(".selected");
    };

    this.selectedTableName = function(){
        return this.selected().find("a").text().trim();        
    };

};

var Results = function(selector, app){
    var element = $(selector);
    
    // Clicking on a table cell highlights that cell
    element.find("td").live("click", function(){
        app.nav.select($(this));
    });

    this.update = function(html){
        element.html(html);
    };
};

var QueryBox = function(selector){
    var element = $(selector);
    var form = element.find("form");
    var textarea = element.find("textarea");
    var that = this;

    // Initialize jQuery elements
    (function(){
        textarea.keylock({
            "<Esc>": function(){
                that.blur()
                return false;
            },
            "<D-CR>": function(){
                $(document).trigger("execquery", that.query());
                return false;
            },
        });

        form.live("submit", function(){
            $(document).trigger("execquery", textarea.val());
            return false;
        });
    })();

    this.focus = function(){
        textarea.focus().select();
    };

    this.blur = function(){
        textarea.blur();
    };

    this.update = function(value){
        textarea.val(value);   
    };

    this.query = function(){
        return textarea.val();
    };

    this.resize = function(){
        textarea.css({"width": ($(window).width()-195)});
    };
};


// Handles the server requests as well as caching similar requests
var Server = function(queryHistory, app){
    var cacheList = [];
    var cacheResults = {};

    this.exec = function(query, reload){
        if(arguments.length == 1) reload = false;

        hash = queryHistory.hash(query);
        if(cacheResults[hash] && reload == false) {
            updateResults(cacheResults[hash]);
            return;
        }

        $.ajax({
            url: "/query",
            data: {"sql": query},
            type: "POST",
            dataType: "json",
            success: function(json){
                updateResults(json);                
                addToCache(query, json);
            },
            error: function(response){
                // TODO: Change into a flash-type message rather
                // than displaying within the results area
                app.results.update(response.responseText);
            }
        });
    };

    var updateResults = function(json){
        app.results.update(json["html"]);
        app.nav.select($("#results td:first")); // TODO Use app.results
        app.updateTitle(query);
    };

    var addToCache = function(query, json){
        hash = queryHistory.hash(query);
        cacheList.push(hash);
        cacheResults[hash] = json;

        if(cacheList.length > 10){
            cacheList.splice(0,1);
        }
    };
};

var QueryHistory = function(){

    this.hash = function(query){
        return "#" + $.sha1(query);
    };

    this.add = function(query){
        hash = this.hash(query);
        localStorage.setItem(hash, query);
        history.pushState(null, "", location.pathname + hash);
        return hash;
    };

    this.addWithHash = function(hash, query){
        hash = "#" + hash; 
        localStorage.setItem(hash, query);
        history.pushState(null, "", location.pathname + hash);
        return hash;
    };

    this.findHash = function(hash){
        return localStorage.getItem(hash);
    };
};

var QueryBuilder = function(){
    var queryCache = {}; 

    this.fromTable = function(name){
        if(queryCache[name]) { return queryCache[name]; }
        queryCache[name] = "SELECT * FROM `" + name + "` LIMIT 200";
        return queryCache[name];
    }
};

// Global module for jQuery objects
var app = {
    updateTitle: (function(){
        var title = $("title");
        return(function(val){
            title.text(val);      
        });
    })(),

    resizeElements: function(){
        app.queryBox.resize();
    }
};

var queryHistory = new QueryHistory();
var queryBuilder = new QueryBuilder();
var server = new Server(queryHistory, app);


// BINDINGS

$(document).bind("browsetable", function(e, table){
    var query = queryBuilder.fromTable(table)

    app.queryBox.update(query);
    app.updateTitle(query);
    server.exec(query);
    queryHistory.addWithHash(table, query);
    app.tables.blur();
});

$(document).bind("execquery", function(e, query){
    server.exec(query);
    queryHistory.add(query);
    app.updateTitle(query);
    app.queryBox.blur();
});

$(document).bind("reloadquery", function(e, sql){
    server.exec(sql, true);
});


// ***************
// Onload function
// ***************
$(function(){
    
    app.queryBox = new QueryBox("#query");
    app.results = new Results("#results", app);
    app.tables = new TableList("#tables");
    app.nav = new Navigator();

    app.resizeElements();

    // Force query box to be the full width at the top
    // $("#query textarea").css({"width": ($(window).width()-195)});

    // Global key bindings
    $(document).keylock({
        // History navigation
        "n": function(){ history.forward(); },
        "p": function(){ history.back(); },

        // Reload current query
        "r": function(){ 
            $(document).trigger("reloadquery", app.queryBox.query());
        },

        // Result Table navigation
        "h": app.nav.moveLeft,
        "l": app.nav.moveRight,
        "j": app.nav.moveDown,
        "k": app.nav.moveUp,

        // Go-to key bindings
        "g": {
            "t": function(e){
                app.tables.focus();
                return false;
            },

            "s": function(e){
                app.queryBox.focus();
                return false;
            },
        },
    }); // end keylock

    // Take control of the history
    $(window).bind('popstate', function(event){
        if(location.hash == "") {
            app.queryBox.update("");   
        }
        else {
            var query = queryHistory.findHash(location.hash)
            app.queryBox.update(query);
            server.exec(query);
        }
    });

});


