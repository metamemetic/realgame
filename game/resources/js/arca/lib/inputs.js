'use strict'

var createInputs = require('game-inputs')
var extend = require('extend')


module.exports = function (arca, opts, element) {
    return makeInputs(arca, opts, element)
}


var defaultBindings = {
    bindings: {
        "forward": ["W", "<up>"],
        "left": ["A", "<left>"],
        "backward": ["S", "<down>"],
        "right": ["D", "<right>"],
        "fire": "<mouse 1>",
        "mid-fire": ["<mouse 2>", "Q"],
        "alt-fire": ["<mouse 3>", "E"],
        "jump": "<space>",
        "sprint": "<shift>",
        "crouch": "<control>"
    }
}


function makeInputs(arca, opts, element) {
    opts = extend({}, defaultBindings, opts)
    var inputs = createInputs(element, opts)
    var b = opts.bindings
    for (var name in b) {
        var arr = (Array.isArray(b[name])) ? b[name] : [b[name]]
        arr.unshift(name)
        inputs.bind.apply(inputs, arr)
    }
    return inputs
}
