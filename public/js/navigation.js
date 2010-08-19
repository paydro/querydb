var Navigator = {
    selected: function(){ return $("#results td.selected"); },
    moveLeft: function(){
        if(this.selected().prev().length){
            this.selected().
                removeClass("selected").
                prev().addClass("selected");

            if(!Scroller.isInView(this.selected())){
                Scroller.scrollLeft(this.selected());
            }
        }
    },
    moveRight: function(){
        if(this.selected().next().length){
            this.selected().
                removeClass("selected").
                next().addClass("selected");

            if(!Scroller.isInView(this.selected())){
                Scroller.scrollRight(this.selected());
            }
        }
    },
    moveUp: function(){
        if(this.selected().parent().prev().length){
            var index = this.selected().index();
            var newSelected = this.selected().
                removeClass("selected").
                parent().
                prev().children().get(index);
            $(newSelected).addClass("selected");

            if(!Scroller.isInView(this.selected())){
                Scroller.scrollUp(this.selected());
            }
        }
    },
    moveDown: function(){
        if(this.selected().parent().next().length){
            var index = this.selected().index();
            var newSelected = this.selected().
                removeClass("selected").
                parent().
                next().children().get(index);
            $(newSelected).addClass("selected");

            if(!Scroller.isInView(this.selected())){
                Scroller.scrollDown(this.selected());
            }
        }
    },

    moveTo: function(element){
        this.selected().removeClass("selected");
        element.addClass("selected");
    },
};

var Scroller = {
    isInView: function(element){
        var results = $("#results");
        // var windowTop = $(window).scrollTop();
        // var windowBottom = windowTop + $(window).height();
        var windowTop = $("#results-container").scrollTop();
        var windowBottom = windowTop + $("#results-container").height();

        var resultsLeft = results.offset().left;
        var resultsRight = resultsLeft + results.width();
        var resultsRight = results.width();

        var elemTop = element.offset().top;
        // Compensate for scroll bars
        var elemBottom = elemTop + (2.5 * element.height());

        var elemLeft = element.offset().left;
        var elemRight = elemLeft + element.width();

        var v = ((elemBottom <= windowBottom) && (elemTop >= windowTop));
        var h = ((elemRight <= resultsRight) && (elemLeft >= resultsLeft));

        return (h && v);
    },
    scrollLeft: function(element){
        var r = $("#results-container");
        var scrollTo = r.scrollLeft() -
                       (r.offset().left - element.offset().left);
        r.scrollLeft(scrollTo);
    },
    scrollRight: function(element){
        var r = $("#results-container");
        var scrollTo = r.scrollLeft() +
                       element.offset().left + element.width() -
                       r.width();
        r.scrollLeft(scrollTo);
    },
    scrollUp: function(element){
        // $(window).scrollTop(element.offset().top);
        $("#results-container").scrollTop(element.offset().top);
    },

    scrollDown: function(element){
        // $(window).scrollTop($(window).scrollTop() + (2 * element.height()));
        $("#results-container").scrollTop($("#results-container").scrollTop() + (2 * element.height()));
    },
    scrollToStart: function(){
        // $(window).scrollTop(0).scrollLeft(0);
        $("#results-container").scrollTop(0).scrollLeft(0);
    }
};

