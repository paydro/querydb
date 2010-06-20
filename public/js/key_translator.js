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
        13: "CR",
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
