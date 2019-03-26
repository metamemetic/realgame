'use strict'

var extend = require('extend')
var createGameShell = require('game-shell')
var EventEmitter = require('events').EventEmitter


module.exports = function (arca, opts) {
	return new Container(arca, opts)
}

/*
*  Container module
*    Wraps game-shell module and manages HTML container, canvas, etc.
*    Emits: DOMready
*/

function Container(arca, opts) {
	opts = opts || {}
	this._arca = arca
	this.element = opts.domElement || createContainerDiv()
	this.canvas = getOrCreateCanvas(this.element)
	this._shell = createShell(this.canvas, opts)

	// mouse state/feature detection
	this.hasPointerLock = false
	this.supportsPointerLock = false
	this.pointerInGame = false
	this.windowFocused = document.hasFocus()

	// basic listeners
	var self = this
	var lockChange = function (ev) { onLockChange(self, ev) }
	document.addEventListener("pointerlockchange", lockChange, false)
	document.addEventListener("mozpointerlockchange", lockChange, false)
	document.addEventListener("webkitpointerlockchange", lockChange, false)
	detectPointerLock(self)

	self.element.addEventListener('mouseenter', function () { self.pointerInGame = true })
	self.element.addEventListener('mouseleave', function () { self.pointerInGame = false })

	window.addEventListener('focus', function () { self.windowFocused = true })
	window.addEventListener('blur', function () { self.windowFocused = false })

	// get shell events after it's initialized
	this._shell.on('init', onShellInit.bind(null, this))
}

Container.prototype = Object.create(EventEmitter.prototype)



/*
*   SHELL EVENTS
*/

function onShellInit(self) {
	// create shell listeners that drive engine functions
	var arca = self._arca
	var shell = self._shell
	shell.on('tick', function onTick(n) { arca.tick(n) })
	shell.on('render', function onRender(n) { arca.render(n) })
	shell.on('resize', arca.rendering.resize.bind(arca.rendering))

	// let other components know DOM is ready
	self.emit('DOMready')
}



/*
*   PUBLIC API
*/

Container.prototype.appendTo = function (htmlElement) {
	this.element.appendChild(htmlElement)
}



Container.prototype.setPointerLock = function (lock) {
	// not sure if this will work robustly
	this._shell.pointerLock = !!lock
}





/*
*   INTERNALS
*/



function createContainerDiv() {
	// based on github.com/mikolalysenko/game-shell - makeDefaultContainer()
	var container = document.createElement("div")
	container.tabindex = 1
	container.style.position = "absolute"
	container.style.left = "0px"
	container.style.right = "0px"
	container.style.top = "0px"
	container.style.bottom = "0px"
	container.style.height = "100%"
	container.style.overflow = "hidden"
	document.body.appendChild(container)
	document.body.style.overflow = "hidden" //Prevent bounce
	document.body.style.height = "100%"
	container.id = 'arca-container'
	return container
}


function createShell(canvas, _opts) {
	var shellDefaults = {
		pointerLock: true,
		preventDefaults: false
	}
	var opts = extend(shellDefaults, _opts)
	opts.element = canvas
	var shell = createGameShell(opts)
	shell.preventDefaults = opts.preventDefaults
	return shell
}

function getOrCreateCanvas(el) {
	// based on github.com/stackgl/gl-now - default canvas
	var canvas = el.querySelector('canvas')
	if (!canvas) {
		canvas = document.createElement('canvas')
		canvas.style.position = "absolute"
		canvas.style.left = "0px"
		canvas.style.top = "0px"
		canvas.style.height = "100%"
		canvas.style.width = "100%"
		canvas.id = 'arca-canvas'
		el.insertBefore(canvas, el.firstChild);
	}
	return canvas
}


// track changes in Pointer Lock state
function onLockChange(self, ev) {
	var el = document.pointerLockElement ||
		document.mozPointerLockElement ||
		document.webkitPointerLockElement
	if (el) {
		self.hasPointerLock = true
		self.emit('gainedPointerLock')
	} else {
		self.hasPointerLock = false
		self.emit('lostPointerLock')
	}
	// this works around a Firefox bug where no mouse-in event
	// gets issued after starting pointerlock
	if (el) {
		// act as if pointer is in game window while pointerLock is true
		self.pointerInGame = true
	}
}


// set up stuff to detect pointer lock support.
// Needlessly complex because Chrome/Android claims to support but doesn't.
// For now, just feature detect, but assume no support if a touch event occurs
// TODO: see if this makes sense on hybrid touch/mouse devices
function detectPointerLock(self) {
	var lockElementExists =
		('pointerLockElement' in document) ||
		('mozPointerLockElement' in document) ||
		('webkitPointerLockElement' in document)
	if (lockElementExists) {
		self.supportsPointerLock = true
		var listener = function (e) {
			self.supportsPointerLock = false
			document.removeEventListener(e.type, listener)
		}
		document.addEventListener('touchmove', listener)
	}
}
