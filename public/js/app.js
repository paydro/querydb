var TableList = function(selector){
    var element = $(selector);
    var list = element.find("ul");
    var filterBox = element.find("#filter");
    var that = this;
    var scroller = new Scroller(list);

    // Initialize jQuery elements
    (function(){

        var selectNext = function(){
            var selected = that.selected();
            var next = selected.nextAll("li:visible:first");
            if(next.length){
                selected.removeClass("selected");
                next.addClass("selected");
                scroller.scrollIntoView(that.selected());
            }
            return false;
        };

        var selectPrev = function(){
            var selected = that.selected();
            var prev = selected.prevAll("li:visible:first");
            if(prev.length){
                selected.removeClass("selected");
                prev.addClass("selected");
                scroller.scrollIntoView(that.selected());
            }
            return false;
        };

        // Initialize keybindings
        filterBox.keylock({
            "<Esc>": function(){
                that.blur();
                that.clear();
                return false;
            },
            "<CR>": function(e){
                $(document).trigger("browsetable", that.selectedTableName());
                that.blur();
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

    this.element = function(){
        return element;
    };

    this.focus = function(){
        filterBox.focus().select();
    };

    this.blur = function(){
        filterBox.blur();
    };

    this.clear = function(){
        filterBox.val("").keyup();
    }

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

    this.resize = function(){
        element.css({"height": $(window).height() - $("#header").height()});
        list.css({"height": element.height() - filterBox.parent().height() - 4});
    };
};

// TODO: Move all navigation functions in here
var Results = function(selector, app){
    var element = $(selector);

    // Clicking on a table cell highlights that cell
    element.find("td").live("click", function(){
        app.nav.select($(this));
    });

    this.element = function(){
        return element;
    };

    this.update = function(html){
        element.html(html);
    };

    this.toggleTextCells = function(){
        var textCells = app.nav.selected().parent().find(".text");
        textCells.find(".partial").toggle();
        textCells.find(".full").toggle();
    };

    this.resize = function(){
        element.css({
            "width": $(window).width() - app.tables.element().outerWidth(),
            "height": $(window).height() - app.queryBox.element().outerHeight()
        });
    };
};

var QueryBox = function(selector){
    var element = $(selector);
    var form = element.find("form");
    var textarea = element.find("textarea");
    var messageBox = element.find(".message-box");
    var ajaxLoader = element.find(".ajax-loader");
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

    this.element = function(){
        return element;
    };

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
        element.css({"width": ($(window).width()-194)});
    };

    this.addMessage = function(msg){
        var message = $("<p>" + msg + "</p>").appendTo(messageBox);
        setTimeout(function(){
            message.fadeOut("fast", function() { message.remove(); });
        }, 3000);
    };

    this.startAjaxLoader = function(){
        ajaxLoader.show();
    };

    this.stopAjaxLoader = function(){
        ajaxLoader.hide();
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
                if(json.html){
                    updateResults(json);
                    addToCache(query, json);
                }
                else if(json.affected_rows){
                    app.queryBox.addMessage(
                        json.affected_rows + " rows affected"
                    )
                    app.results.update("");
                }
            },
            error: function(response){
                // TODO: Change into a flash-type message rather
                // than displaying within the results area
                app.results.update(response.responseText);
            }
        });
    };

    var updateResults = function(json){
        app.results.update(json.html);
        // TODO Use app.results
        app.nav.select($("#results td:first").not(".empty-set"));
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
        app.tables.resize();
        app.results.resize();
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
    server.exec(query, true);
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

    // Global key bindings
    $(document).keylock({
        // History navigation
        "n": function(){ history.forward(); },
        "p": function(){ history.back(); },

        // Reload current query
        "r": function(){
            $(document).trigger("reloadquery", app.queryBox.query());
        },

        "v": app.results.toggleTextCells,

        "V": function(){
            $("#results td.text .partial").hide();
            $("#results td.text .full").show();
        },
        "<C-V>": function(){
            $("#results td.text .partial").show();
            $("#results td.text .full").hide();
        },

        // Result Table navigation
        "h": app.nav.moveLeft,
        "l": app.nav.moveRight,
        "j": app.nav.moveDown,
        "k": app.nav.moveUp,
        "0": app.nav.moveToStart,
        "$": app.nav.moveToEnd,

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
            app.updateTitle(query);

            // Only execute READ queries on reload
            if(!query.match(/insert|delete|update|alter/i)) {
                server.exec(query);
            }
            else {
                app.results.update("Don't worry, the above query wasn't run! If you want to run it, just hit the 'QUERY' button and it'll go to work.");
            }
        }
    }).resize(function(){
        app.resizeElements();
    });


    $(document).ajaxSend(function(){
        app.queryBox.startAjaxLoader();
    }).ajaxComplete(function(){
        app.queryBox.stopAjaxLoader();
        // If the window adds scrollbars after an AJAX load, we need to
        // resize the elements on the page.
        app.resizeElements();
    });

});


