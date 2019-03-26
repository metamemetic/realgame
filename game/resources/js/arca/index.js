/**
 * Arca: Lightweight voxel engine built on BabylonJS, inspired by noa-engine
 */

var aabb = require('aabb-3d')
var vec3 = require('gl-vec3')
var extend = require('extend')  // Extend one object with one or more others, returning the modified object
var voxjs = require('vox.js')   // MagicaVoxel file parser
var ndarray = require('ndarray')
var EventEmitter = require('events').EventEmitter
var createContainer = require('./lib/container')
var createRendering = require('./lib/rendering')
var createWorld = require('./lib/world')
var createInputs = require('./lib/inputs')
var createPhysics = require('./lib/physics')
var createCamControls = require('./lib/camera')
var createRegistry = require('./lib/registry')
var createEntities = require('./lib/entities')
var raycast = require('fast-voxel-raycast')

module.exports = Engine

// profiling flag
var PROFILE = 0
var PROFILE_RENDER = 0

var defaults = {
    userControlsCamera: true,
    /** noa */
    playerHeight: 1.8,
    playerWidth: 0.6,
    playerStart: [0, 10, 0],
    playerAutoStep: false,
    tickRate: 30,
    blockTestDistance: 10,
    stickyPointerLock: true,
    dragCameraOutsidePointerLock: true,
    skipDefaultHighlighting: false
}

/**
 * Main engine object
*/

function Engine(opts) {
    if (!(this instanceof Engine)) return new Engine(opts)
    opts = extend(defaults, opts)
    this._tickRate = opts.tickRate
    this._paused = false
    this._dragOutsideLock = opts.dragCameraOutsidePointerLock
    var self = this

    // container (html/div) manager
    this.container = createContainer(this, opts)

    // inputs manager - abstracts key/mouse input
    this.inputs = createInputs(this, opts, this.container.element)

    // create block/item property registry
    this.registry = createRegistry(this, opts)

    // create world manager
    this.world = createWorld(this, opts)

    // rendering manager - abstracts all draws to 3D context
    this.rendering = createRendering(this, opts, this.container.canvas)

    // Entity manager / Entity Component System (ECS)
    this.entities = createEntities(this, opts)
    // convenience
    this.ents = this.entities

    // physics engine - solves collisions, properties, etc.
    this.physics = createPhysics(this, opts)

    // camera controller
    this.cameraControls = createCamControls(this, opts)


    var ents = this.ents

    /** Entity id for the player entity */
    this.playerEntity = ents.add(
        opts.playerStart,    // starting location- TODO: get from options
        opts.playerWidth, opts.playerHeight,
        null, null,          // no mesh for now, no meshOffset,
        true, true
    )

    // make player entity it collide with terrain and other entities
    ents.addComponent(this.playerEntity, ents.names.collideTerrain)
    ents.addComponent(this.playerEntity, ents.names.collideEntities)

    // adjust default physics parameters
    var body = ents.getPhysicsBody(this.playerEntity)
    body.gravityMultiplier = 2 // less floaty
    body.autoStep = opts.playerAutoStep // auto step onto blocks

    /** reference to player entity's physics body */
    this.playerBody = body

    // input component - sets entity's movement state from key inputs
    ents.addComponent(this.playerEntity, ents.names.receivesInputs)

    // add a component to make player mesh fade out when zooming in
    ents.addComponent(this.playerEntity, ents.names.fadeOnZoom)

    // movement component - applies movement forces
    // todo: populate movement settings from options
    var moveOpts = {
        airJumps: 1
    }
    ents.addComponent(this.playerEntity, ents.names.movement, moveOpts)

    // how high above the player's position the eye is (for picking, camera tracking)
    this.playerEyeOffset = 0.9 * opts.playerHeight




    // set up block targeting
    this.blockTestDistance = opts.blockTestDistance || 10

    /** function for which block IDs are targetable.
     * Defaults to a solidity check, but can be overridden */
    this.blockTargetIdCheck = this.registry.getBlockSolidity

    /** Dynamically updated object describing the currently targeted block */
    this.targetedBlock = null

    // add a default block highlighting function
    if (!opts.skipDefaultHighlighting) {
        // the default listener, defined onto noa in case people want to remove it later
        this.defaultBlockHighlightFunction = function (tgt) {
            if (tgt) {
                self.rendering.highlightBlockFace(true, tgt.position, tgt.normal)
            } else {
                self.rendering.highlightBlockFace(false)
            }
        }
        this.on('targetBlockChanged', this.defaultBlockHighlightFunction)
    }
    //
    //
    //
    //
    // // container (html/div) manager
    // this.container = createContainer(this, opts)
    //
    // // inputs manager - abstracts key/mouse input
    // // this.inputs = createInputs(this, opts, this.container.element)
    //
    // // create block/item property registry
    // this.registry = createRegistry(this, opts)
    //
    // // create world manager
    // this.world = createWorld(this, opts)
    //
    // // rendering manager - abstracts all draws to 3D context
    // this.rendering = createRendering(this, opts, this.container.canvas)

    // run the render loop
    // engine.runRenderLoop(function() {
    //     scene.render();
    // });

    // the canvas/window resize event handler
    // window.addEventListener('resize', function() {
    //     engine.resize();
    // });

    // init rendering stuff that needed to wait for engine internals
    this.rendering.initScene()

    console.log('Arca initialized with opts:', opts)

    // temp hacks for development

    window.arca = this
    window.ndarray = ndarray
    window.vec3 = vec3
    var debug = false
    // this.inputs.bind('debug', 'Z')
    // this.inputs.down.on('debug', function onDebug() {
    //     debug = !debug
    //     if (debug) window.scene.debugLayer.show(); else window.scene.debugLayer.hide();
    // })
}


Engine.prototype = Object.create(EventEmitter.prototype)


/** */
Engine.prototype.setVoxel = function (data) {
    let { x, y, z, r, g, b, a } = data

    let color = new BABYLON.Color4(r/255, g/255, b/255, a)
    let faceColors = [color, color, color, color, color, color]

    let voxel = BABYLON.MeshBuilder.CreateBox("voxel", {size: 1, faceColors}, this.scene);
    voxel.position.x = x
    voxel.position.y = y
    voxel.position.z = z

    return true
}

Engine.prototype.loadModel = function (data) {
    let self = this
    let { x, y, z, vox } = data
    let parser = new voxjs.Parser()

    parser.parse("models/" + vox + ".vox").then(function(voxelData) {
        console.log(vox + ' size:', voxelData.size)
        let voxels = voxelData.voxels
        let palette = voxelData.palette

        let colors = []
        let colorId = 1
        let voxelColor

        palette.forEach(color => {
            colors[colorId] = color
            colorId++
        })

        let numVoxels = 0
        voxels.forEach(voxel => {
            if (numVoxels < 10000) {
                numVoxels++
                voxelColor = colors[voxel.colorIndex + 1]
                self.setVoxel({
                    x: voxel.x + x,
                    y: voxel.z + y,
                    z: voxel.y + z,
                    r: voxelColor.r,
                    g: voxelColor.g,
                    b: voxelColor.b,
                    a: voxelColor.a
                })
            }

        })
    });
}


/*
 * Tick function, called by container module at a fixed timestep. Emits #tick(dt),
 * where dt is the tick rate in ms (default 16.6)
*/

Engine.prototype.tick = function () {
    if (this._paused) return
    profile_hook('start')
    var dt = this._tickRate       // fixed timesteps!
    this.world.tick(dt)           // chunk creation/removal
    profile_hook('world')
    if (!this.world.playerChunkLoaded) {
        // when waiting on worldgen, just tick the meshing queue and exit
        this.rendering.tick(dt)
        return
    }
    this.physics.tick(dt)         // iterates physics
    profile_hook('physics')
    this.rendering.tick(dt)       // zooms camera, does deferred chunk meshing
    profile_hook('rendering')
    updateBlockTargets(this)      // finds targeted blocks, and highlights one if needed
    profile_hook('targets')
    this.emit('tick', dt)
    profile_hook('tick event')
    profile_hook('end')
    this.inputs.tick()            // clears accumulated tick/mouseMove data
    // debugQueues(this)
}



/*
 * Render function, called every animation frame. Emits #beforeRender(dt), #afterRender(dt)
 * where dt is the time in ms *since the last tick*.
*/

Engine.prototype.render = function (framePart) {
    if (this._paused) return
    profile_hook_render('start')
    var dt = framePart * this._tickRate // ms since last tick
    // only move camera during pointerlock or mousedown, or if pointerlock is unsupported
    if (this.container.hasPointerLock ||
        !this.container.supportsPointerLock ||
        (this._dragOutsideLock && this.inputs.state.fire)) {
        this.cameraControls.updateForRender()
    }
    // clear cumulative mouse inputs
    this.inputs.state.dx = this.inputs.state.dy = 0
    // events and render
    this.emit('beforeRender', dt)
    profile_hook_render('before render')
    this.rendering.render(dt)
    profile_hook_render('render')
    this.emit('afterRender', dt)
    profile_hook_render('after render')
    profile_hook_render('end')
}



var profile_hook = function (s) { }
var profile_hook_render = function (s) { }
if (PROFILE) (function () {
    var timer = new (require('./lib/util').Timer)(200, 'tick   ')
    profile_hook = function (state) {
        if (state === 'start') timer.start()
        else if (state === 'end') timer.report()
        else timer.add(state)
    }
})()
if (PROFILE_RENDER) (function () {
    var timer = new (require('./lib/util').Timer)(200, 'render ')
    profile_hook_render = function (state) {
        if (state === 'start') timer.start()
        else if (state === 'end') timer.report()
        else timer.add(state)
    }
})()


/** */
Engine.prototype.getPlayerPosition = function () {
    // return this.entities.getPosition(this.playerEntity)
    return [0, 0, 0]
}
