// Originally stolen from:
// http://ejohn.org/blog/jquery-livesearch/
$.fn.liveUpdate = function(list){
    list = $(list);
    if (list.length) {
        var rows = list.children('li'),
        cache = rows.map(function(){
            return this.innerHTML.toLowerCase();
        });

        var handler = function(e){
            var fn = $(this).keyLock().findFunc(e);
            if(typeof fn === "undefined"){
                filter.apply(this);
            }
        };
        // Note filter happens on key up since we want the character
        // to be inserted before running the filter
        this.live("keyup", handler)
            .live("click", handler)
            .keyup();
    }

    return this;

    function filter(){
        var term = $.trim($(this).val().toLowerCase()), scores = [];

        rows.removeClass("selected");

        if (!term) {
            rows.show();
        } else {
            rows.hide();

            cache.each(function(i){
                var score = this.score(term);
                if (score > 0) { scores.push([score, i]); }
            });

            $.each(scores.sort(function(a, b){return b[0] - a[0];}), function(){
                $(rows[ this[1] ]).show();
            });
        }

        rows.filter(":visible:first").addClass("selected");
    }
};

