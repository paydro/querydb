var Scroller = function(scrollElement, options){
    scrollElement = $(scrollElement);
    var pad = $.extend({ top: 5, left: 5, bottom: 35, right: 40 }, options);

    this.scrollIntoView = function(element){
        var borderTop, borderBottom, borderLeft, borderRight,
            elTop, elBottom, elLeft, elRight;

        borderTop = scrollElement.offset().top + pad.top;
        borderLeft = scrollElement.offset().left + pad.left;
        borderBottom = scrollElement.offset().top +
                       scrollElement.height() -
                       pad.bottom;
        borderRight = scrollElement.offset().left +
                      scrollElement.width() -
                      pad.right;

        elTop = element.offset().top;
        elBottom = element.position().top + element.height();
        elLeft = element.position().left;
        elRight = elLeft + element.width();

        if(elBottom > borderBottom){
            scrollAmount = scrollElement.scrollTop() + elBottom - borderBottom;
            scrollElement.scrollTop(scrollAmount);
        }

        if(elTop < borderTop){
            scrollElement.scrollTop(
                scrollElement.scrollTop() +
                (elTop - scrollElement.offset().top - pad.top)
            );
        }

        if(elRight > borderRight){
            scrollAmount = scrollElement.scrollLeft() + elRight - borderRight;
            scrollElement.scrollLeft(scrollAmount);
        }

        if(elLeft < borderLeft){
            scrollElement.scrollLeft(
                scrollElement.scrollLeft() +
                (elLeft - scrollElement.offset().left - pad.left)
            );
        }
    };
};
