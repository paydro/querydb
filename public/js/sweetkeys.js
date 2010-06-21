var SweetKeys = function(){
    var contexts = {global: {}};
    var curContext = contexts["global"];
    // var keyMap = {};
    var scope = [];

    // == Private functions ==
    var inScope = function(){ return scope.length; };
    var addScope = function(s){ scope.push(s); };
    var findScopeDefs = function(){
        if(!inScope()){
            return curContext;
        }

        var currentDefs = curContext;
        for(i = 0; i < scope.length; i++){
            currentDefs = currentDefs[scope[i]];
        }

        return currentDefs;
    };

    // == DEBUG functions ==
    this.defs = function(){ console.log(curContext); return contexts; };
    this.showScope = function(){ console.log(scope); };


    // Find function to call for a given key
    // Returns a function mapped to the given key. If the key is mapped
    // to an object literal, the function returned adds the key to the
    // current scope listing.
    this.find = function(eventKey){
        var defs = findScopeDefs();
        fnOrObj = defs[eventKey];

        if(typeof fnOrObj === "object"){
            return setScopeFn(eventKey);
        }
        else {
            this.resetScope();
            return fnOrObj;
        }
    };

    // Used to build a closure that
    var setScopeFn = function(k){
        return (function(){ addScope(k); });
    };

    // Define key to actions.
    this.define = function(context, definition){
        if(typeof context === "string"){
            // contexts[context] = definition;
            contexts[context] = {}
            mergeObjects(contexts[context], definition);
            console.log("context " + context);
            console.log(contexts[context]);
        }
        else {
            mergeObjects(contexts["global"], context);
        }
    };

    var mergeObjects = function(obj1, obj2){
        for(key in obj2){
            obj1[key] = obj2[key];
        }
    };

    // Reset the scope listing.
    this.resetScope = function(){
        scope = [];
    }

    this.setContext = function(context){
        curContext = contexts[context];
    }

    this.resetContext = function(){
        curContext = contexts["global"];
    }
};

// Key Translator
SweetKeys.Translator = {
    translate: function(e){
        var key;
        var isModifierPressed = function(e){
            return (e.metaKey ||
                    e.ctrlKey ||
                    e.altKey ||
                    (e.keyCode === 13) || // Enter key
                    (e.keyCode === 27) || // Esc Key
                    (e.keyCode >= 37 && e.keyCode <= 40) // Arrow Keys
                   );
        };

        var codeToKey = function(code, shift){
            if(shift){
                return SweetKeys.Translator.upperCase[code];
            }
            else {
                return SweetKeys.Translator.lowerCase[code];
            }
        };

        // Return an array of modifier keys
        // M = meta/alt key
        // C = ctrl key
        // D = command (apple) key
        var modifierKeys = function(e){
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
        };

        key = codeToKey(e.keyCode, e.shiftKey);
        if(isModifierPressed(e)){
           var modifiers = modifierKeys(e);
           modifiers.push(key);
           key = "<" + modifiers.join("-") + ">";
        }

        return key;
    },
    upperCase: {
        13: "CR",
        191: "?",
        65: "A",
        66: "B",
        67: "C",
        68: "D",
        69: "E",
        70: "F",
        71: "G",
        72: "H",
        73: "I",
        74: "J",
        75: "K",
        76: "L",
        77: "M",
        78: "N",
        79: "O",
        80: "P",
        81: "Q",
        82: "R",
        83: "S",
        84: "T",
        85: "U",
        86: "V",
        87: "W",
        88: "X",
        89: "Y",
        90: "Z",
    },
    lowerCase: {
        27: "Esc",
        13: "CR",
        37: "A-LEFT",
        38: "A-UP",
        39: "A-RIGHT",
        40: "A-DOWN",
        191: "/",
        65: "a",
        66: "b",
        67: "c",
        68: "d",
        69: "e",
        70: "f",
        71: "g",
        72: "h",
        73: "i",
        74: "j",
        75: "k",
        76: "l",
        77: "m",
        78: "n",
        79: "o",
        80: "p",
        81: "q",
        82: "r",
        83: "s",
        84: "t",
        85: "u",
        86: "v",
        87: "w",
        88: "x",
        89: "y",
        90: "z",
    },

};

