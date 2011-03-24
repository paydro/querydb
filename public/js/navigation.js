var Navigator = function(){
    // Holds onto the currently selected "td" element.
    // This changes as the user selects/moves to new elements
    var selected;

    // Height of results header is 23 pixels.
    // TODO Make this dynamic. It cannot be dynamic right now since the header
    // for the #results table does not exist on initial load of the app.
    var scroller = new Scroller($("#results"), {top: 23});
    var that = this;

    // Convenience method - scroll the selected element into view
    var scrollIntoView = function(){
        scroller.scrollIntoView(selected);
    };

    // Convenience method to remove the old element's "select" class,
    // add the "select" class to the new element, and assign the
    // "selected" private variable. BAM!
    var markSelected = function(oldElement, newElement){
        if(oldElement) {
            $(oldElement).removeClass("selected")
                         .parents("tr")
                            .removeClass("selected");

        }

        // Ensure operation on the TD element
        newElement = $(newElement);
        if(!newElement.is("td")){
            newElement = newElement.parents("td");
        }
        selected = newElement.addClass("selected")
                             .parents("tr")
                                 .addClass("selected")
                             .end();
    };

    this.moveLeft = function(){
        if(!selected) return;
        var newElement;
        if((newElement = selected.prev()).length){
            markSelected(selected, newElement);
            scrollIntoView();
        }
    };

    this.moveRight =  function(){
        if(!selected) return;
        var newElement;
        if((newElement = selected.next()).length){
            markSelected(selected, newElement);
            scrollIntoView();
        }
    };


    this.moveUp = function(){
        if(!selected) return;
        var prevRow;
        if((prevRow = selected.parent().prev()).length){
            var index = selected.index();
            markSelected(selected, prevRow.children()[index])
            scrollIntoView();
        }
    };

    this.moveDown = function(){
        if(!selected) return;
        var nextRow;
        if((nextRow = selected.parent().next()).length){
            var index = selected.index();
            markSelected(selected, nextRow.children()[index]);
            scrollIntoView();
        }
    };

    this.moveToStart = function(){
        if(!selected) return;
        that.select(selected.parent().find("td:first-child"));
    };

    this.moveToEnd = function(){
        if(!selected) return;
        that.select(selected.parent().find("td:last-child"));
    };

    // Select a element
    this.select = function(element){
        if(!element.length) return;
        markSelected(selected, element);
        scrollIntoView();
    };

    this.selected = function(){
        return selected;
    };

};


