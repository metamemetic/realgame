/**
 * Arca: Lightweight voxel engine built on BabylonJS, inspired by noa-engine
 */

var extend = require('extend')  // Extend one object with one or more others, returning the modified object
var vox = require('vox.js')     // MagicaVoxel file parser

module.exports = Engine

var defaults = {
    userControlsCamera: true
}

/**
 * Main engine object
*/

function Engine(opts) {
    if (!(this instanceof Engine)) return new Engine(opts)
    opts = extend(defaults, opts)
    console.log('Arca initialized with opts:', opts)
}
