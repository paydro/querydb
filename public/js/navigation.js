var Navigator = function(){
    var selected; // element with class="selected"
    var that = this;

    // Helper that moves selected elements into view
    this.Scroller = {
        topPadding: 148,
        leftPadding: 192,
        scrollIntoView: function(element){
            var borderTop, borderBottom, borderLeft, borderRight,
                elTop, elBottom, elLeft, elRight, win;

            win = $(window)
            borderTop = win.scrollTop() + that.Scroller.topPadding;
            // Without subtracting 15 from the bottom border, the element will
            // be off screen. The difference is to push it into the viewable
            // area. Sadly, I'm not sure why I have to do this.
            borderBottom = win.scrollTop() + win.height() - 15;
            borderLeft = win.scrollLeft() + that.Scroller.leftPadding;
            // Again, like the bottom border trick above, subtract 25 so that
            // the selected element is pushed into the viewable area.
            borderRight = win.scrollLeft() + win.width() - 25;

            elTop = element.offset().top;
            elBottom = elTop + element.height();
            elLeft = element.offset().left;
            elRight = elLeft + element.width();

            if(elBottom > borderBottom){
                scrollAmount = win.scrollTop() + elBottom - borderBottom;
                win.scrollTop(scrollAmount);
            }

            if(elTop < borderTop){
                win.scrollTop(elTop - that.Scroller.topPadding);
            }

            if(elLeft < borderLeft){
                win.scrollLeft(elLeft - that.Scroller.leftPadding);
            }

            if(elRight > borderRight){
                scrollAmount = win.scrollLeft() + elRight - borderRight;
                win.scrollLeft(scrollAmount);
            }
        }
    };

    var scrollIntoView = function(){
        that.Scroller.scrollIntoView(selected);
    }

    // Convenience method to remove the old element's "select" class,
    // add the "select" class to the new element, and assign the
    // "selected" private variable. BAM!
    var markSelected = function(oldElement, newElement){
        if(oldElement) {
            $(oldElement).removeClass("selected");
        }
        selected = $(newElement).addClass("selected");
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
        that.select(selected.parent().find(":first-child"));
    };

    this.moveToEnd = function(){
        if(!selected) return;
        that.select(selected.parent().find(":last-child"));
    };

    // Select a element
    this.select = function(element){
        if(!element.length) return;
        markSelected(selected, element);
        scrollIntoView();
    };

};


