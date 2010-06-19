// Stack that stores all query hashes
var HashStack = function(){
    // Array of hashes
    var stack = [];
    var pointer = 0;

    // Load up stack
    stack = QueryStore.findAll();

    // Point to 1 past the last so that on page load
    // a user can hit previous and get the last query
    if(stack.length) {
        pointer = stack.length;
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

    this.clear = function(){
        stack = [];
        pointer = 0;
        QueryStore.clear();
    };

    // Print out hash ordering and the corresponding queries
    this.debug = function(){
        console.log("Pointer at: " + pointer);
        for(i = 0; i < stack.length; i++){
            console.log("[" + i + "] Hash: " + stack[i]);
            console.log("[" + i + "] Query: " + QueryStore.find(stack[i]));
        }
    }
}
