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
