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
/** https://gist.github.com/bnolan/7cc954de84ae0b88646899db5b6d1229 */
var createAOMesh = require('ao-mesher')
var fill = require('ndarray-fill')
var parseMagicaVoxel = require('parse-magica-voxel')
var nbt = require('prismarine-nbt')
// var nbt = require('nbt')

var Schematic = require('mc-schematic')('1.8')
// var Schematic = require('minecraft-schematic');


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

    // init rendering stuff that needed to wait for engine internals
    this.rendering.initScene()

    console.log('Arca initialized with opts:', opts)

    // temp hacks for development

    window.arca = this
    window.ndarray = ndarray
    window.vec3 = vec3
    var debug = false
    this.inputs.bind('debug', 'Z')
    this.inputs.down.on('debug', function onDebug() {
        debug = !debug
        if (debug) window.scene.debugLayer.show(); else window.scene.debugLayer.hide();
    })
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

    parser.parse("models/" + vox + ".vox").then(function(parsed) {
        console.log(vox + ' size:', parsed.size)
        let voxels = parsed.voxels
        let palette = parsed.palette

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

Engine.prototype.loadSchematic = function(model) {
    _loadSchematicFile('/models/' + model + '.schematic',
        function(data) {

            nbt.parseUncompressed(new Buffer(data), function(error, data) {
                console.log(data)
                // console.log(data.value.stringTest.value);
                // console.log(data.value['nested compound test'].value);
            });

            // console.log(data)

// Schematic.loadSchematic
            // nbt.parse(data.arrayBuffer(), function (err, schem) {

                // console.log(schem)

                // console.log(schem.getBlock(0, 0, 0));
                // console.log('width:', schem.width)    // x
                // console.log('height:', schem.height)  // y
                // console.log('length:', schem.length)  // z

            // });

            // console.log('Schematic parsergasm:', data)
            // nbt.parse(data, function(error, data) {
            //     if (error) { throw error }
            //
            //     console.log('DATA:', data)
            // })
        }
    )
}

var _loadSchematicFile = function (path, success, error) {
     var xhr = new XMLHttpRequest();
     xhr.onreadystatechange = function()
     {
         if (xhr.readyState === XMLHttpRequest.DONE) {
             if (xhr.status === 200) {
                 if (success)
                     success(xhr.responseText);
             } else {
                 if (error)
                     error(xhr);
             }
         }
     };
     xhr.open("GET", path, false);
     xhr.send();
}

Engine.prototype.loadVoxModel = function(data) {
    let self = this
    let {
        x,
        y,
        z,
        vox
    } = data
    // let parser = new voxjs.Parser()

    let B = BABYLON

    //
    // Lighting
    //
    let light1 = new B.HemisphericLight('light1', new B.Vector3(0,5,0), scene);
    light1.intensity = 0.5

    var light2 = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(-10, -20, -10), scene)
    var shadowGenerator = new BABYLON.ShadowGenerator(2048, light2)
    shadowGenerator.usePoissonSampling = true;

    let mat =  new B.StandardMaterial( "mat", scene );
    mat.diffuseColor = new B.Color3( 0.8, 0, 0 );

    fetch("models/" + vox + ".vox")
        .then(r => r.arrayBuffer())
        .then(buffer => {
            let parsed = parseMagicaVoxel(buffer)
            console.log(parsed)

            let size = parsed.SIZE

            // Oversize because ao-mesher doesn't create faces on the boundaries
            size.x += 3
            size.y += 3
            size.z += 3

            // Construct an ndarray
            let field = ndarray(new Uint16Array(size.x * size.y * size.z), [size.x, size.y, size.z])
            fill(field, (x, y, z) => 0)

            parsed.XYZI.forEach(row => {
                let {
                    x,
                    y,
                    z,
                    c
                } = row
                field.set(x, y, z, c + (1 << 15))
            })

            const vertData = createAOMesh(field)

            // Convert the vertData format into a babylon.js Mesh
            let face = 0
            let i = 0
            let s = 1

            const hue = 0
            const positions = []
            const indices = []
            const normals = []
            const colors = []

            // Identity function, use these to nudge the mesh as needed
            const fx = x => x - 25
            const fy = y => y + 55
            const fz = z => z + 25

            while (i < vertData.length) {
                const textureIndex = vertData[i + 7]

                // const color = new B.Color3(1, 1, 0)
                var a = new B.Vector3(vertData[i + 0], vertData[i + 1], vertData[i + 2])
                positions.push(fx(vertData[i + 0] * s))
                positions.push(fy(vertData[i + 1] * s))
                positions.push(fz(vertData[i + 2] * s))
                i += 8

                var b = new B.Vector3(vertData[i + 0], vertData[i + 1], vertData[i + 2])
                positions.push(fx(vertData[i + 0] * s))
                positions.push(fy(vertData[i + 1] * s))
                positions.push(fz(vertData[i + 2] * s))
                i += 8

                var c = new B.Vector3(vertData[i + 0], vertData[i + 1], vertData[i + 2])
                positions.push(fx(vertData[i + 0] * s))
                positions.push(fy(vertData[i + 1] * s))
                positions.push(fz(vertData[i + 2] * s))
                i += 8

                // Face index
                indices.push(face + 0, face + 2, face + 1)

                const intensity = 0.5
                const offset = 0.4
                let color = new B.Color3(parsed.RGBA[textureIndex].r / 255, parsed.RGBA[textureIndex].g / 255, parsed.RGBA[textureIndex].b / 255)

                colors.push(color.r * (vertData[i - 24 + 3] / 255 * intensity + offset))
                colors.push(color.g * (vertData[i - 24 + 3] / 255 * intensity + offset))
                colors.push(color.b * (vertData[i - 24 + 3] / 255 * intensity + offset))
                colors.push(1)

                colors.push(color.r * (vertData[i - 16 + 3] / 255 * intensity + offset))
                colors.push(color.g * (vertData[i - 16 + 3] / 255 * intensity + offset))
                colors.push(color.b * (vertData[i - 16 + 3] / 255 * intensity + offset))
                colors.push(1)

                colors.push(color.r * (vertData[i - 8 + 3] / 255 * intensity + offset))
                colors.push(color.g * (vertData[i - 8 + 3] / 255 * intensity + offset))
                colors.push(color.b * (vertData[i - 8 + 3] / 255 * intensity + offset))
                colors.push(1)

                face += 3
            }

            // Create transferrable objects
            let positionsArray = new Float32Array(positions)
            let indicesArray = new Float32Array(indices)
            let colorsArray = new Float32Array(colors)

            let mesh = new B.Mesh('voxel-mesh', scene)
            mesh.scaling.set(0.25, 0.25, 0.25)
            mesh.rotation.set(-Math.PI / 2, 0, 0)
            mesh.position.set(-8, -2, 8)
            mesh.receiveShadows = true

            var mat = new BABYLON.StandardMaterial('voxel-material', scene);
            mat.specularColor = new BABYLON.Color3(0, 0, 0)
            mesh.material = mat

            var vertexData = new B.VertexData()
            B.VertexData.ComputeNormals(positions, indices, normals)

            // Assign positions, indices and normals to vertexData
            vertexData.positions = positions
            vertexData.indices = indices
            vertexData.normals = normals
            vertexData.colors = colors

            // Apply vertexData to custom mesh
            vertexData.applyToMesh(mesh)

            shadowGenerator.getShadowMap().renderList.push(mesh)

        })
}
//
//     parser.parse("models/" + vox + ".vox").then(function(parsed) {
//
//         var B = BABYLON
//
//         //
//         // Lighting
//         //
//         let light1 = new B.HemisphericLight('light1', new B.Vector3(0,5,0), scene);
//         light1.intensity = 0.5
//
//         var light2 = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(-10, -20, -10), scene)
//         var shadowGenerator = new BABYLON.ShadowGenerator(2048, light2)
//         shadowGenerator.usePoissonSampling = true;
//
//         let size = parsed.size
//         console.log(vox + ' size:', size)
//
//         let voxels = parsed.voxels
//
//         // Oversize because ao-mesher doesn't create faces on the boundaries
//         size.x += 3
//         size.y += 3
//         size.z += 3
//
//         // Construct an ndarray
//         let field = ndarray(new Uint16Array(size.x * size.y * size.z), [size.x, size.y, size.z])
//         fill(field, (x, y, z) => 0)
//
//         voxels.forEach(row => {
//             // console.log(row)
//             let { x, y, z, colorIndex } = row
//             field.set(x, y, z, colorIndex + (1 << 15))
//         })
//
//         const vertData = createAOMesh(field)
//
//         console.log('What now?', vertData)
//
//
//         // Convert the vertData format into a babylon.js Mesh
//         let face = 0
//         let i = 0
//         let s = 1
//
//         const hue = 0
//         const positions = []
//         const indices = []
//         const normals = []
//         const colors = []
//
//         // Identity function, use these to nudge the mesh as needed
//         const fx = x => x
//         const fy = y => y + 10
//         const fz = z => z + 35
//
//         while (i < vertData.length) {
//             const textureIndex = vertData[i + 7]
//
//             // const color = new B.Color3(1, 1, 0)
//             var a = new B.Vector3(vertData[i + 0], vertData[i + 1], vertData[i + 2])
//             positions.push(fx(vertData[i + 0] * s))
//             positions.push(fy(vertData[i + 1] * s))
//             positions.push(fz(vertData[i + 2] * s))
//             i += 8
//
//             var b = new B.Vector3(vertData[i + 0], vertData[i + 1], vertData[i + 2])
//             positions.push(fx(vertData[i + 0] * s))
//             positions.push(fy(vertData[i + 1] * s))
//             positions.push(fz(vertData[i + 2] * s))
//             i += 8
//
//             var c = new B.Vector3(vertData[i + 0], vertData[i + 1], vertData[i + 2])
//             positions.push(fx(vertData[i + 0] * s))
//             positions.push(fy(vertData[i + 1] * s))
//             positions.push(fz(vertData[i + 2] * s))
//             i += 8
//
//             // Face index
//             indices.push(face + 0, face + 2, face + 1)
//
//             const intensity = 0.5
//             const offset = 0.4
//             let color = new B.Color3(parsed.palette[textureIndex].r / 255, parsed.palette[textureIndex].g / 255, parsed.palette[textureIndex].b / 255)
//
//             colors.push(color.r * (vertData[i - 24 + 3] / 255 * intensity + offset))
//             colors.push(color.g * (vertData[i - 24 + 3] / 255 * intensity + offset))
//             colors.push(color.b * (vertData[i - 24 + 3] / 255 * intensity + offset))
//             colors.push(1)
//
//             colors.push(color.r * (vertData[i - 16 + 3] / 255 * intensity + offset))
//             colors.push(color.g * (vertData[i - 16 + 3] / 255 * intensity + offset))
//             colors.push(color.b * (vertData[i - 16 + 3] / 255 * intensity + offset))
//             colors.push(1)
//
//             colors.push(color.r * (vertData[i - 8 + 3] / 255 * intensity + offset))
//             colors.push(color.g * (vertData[i - 8 + 3] / 255 * intensity + offset))
//             colors.push(color.b * (vertData[i - 8 + 3] / 255 * intensity + offset))
//             colors.push(1)
//
//             face += 3
//         }
//
//         // Create transferrable objects
//         let positionsArray = new Float32Array(positions)
//         let indicesArray = new Float32Array(indices)
//         let colorsArray = new Float32Array(colors)
//
//         let mesh = new B.Mesh('voxel-mesh', scene)
//         mesh.scaling.set(0.25, 0.25, 0.25)
//         mesh.rotation.set(-Math.PI / 2, 0, 0)
//         mesh.position.set(-8, -2, 8)
//         mesh.receiveShadows = true
//
//         var mat = new BABYLON.StandardMaterial('voxel-material', scene);
//         mat.specularColor = new BABYLON.Color3(0, 0, 0)
//         mesh.material = mat
//
//         var vertexData = new B.VertexData()
//         B.VertexData.ComputeNormals(positions, indices, normals)
//
//         // Assign positions, indices and normals to vertexData
//         vertexData.positions = positions
//         vertexData.indices = indices
//         vertexData.normals = normals
//         vertexData.colors = colors
//
//         // Apply vertexData to custom mesh
//         vertexData.applyToMesh(mesh)
//
//         shadowGenerator.getShadowMap().renderList.push(mesh)
//     });
// }


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



var __qwasDone = true, __qstart
function debugQueues(self) {
    var a = self.world._chunkIDsToAdd.length
    var b = self.world._chunkIDsToCreate.length
    var c = self.rendering._chunksToMesh.length
    var d = self.rendering._numMeshedChunks
    if (a + b + c > 0) console.log([
        'Chunks:', 'unmade', a,
        'pending creation', b,
        'to mesh', c,
        'meshed', d,
    ].join('   \t'))
    if (__qwasDone && a + b + c > 0) {
        __qwasDone = false
        __qstart = performance.now()
    }
    if (!__qwasDone && a + b + c === 0) {
        __qwasDone = true
        console.log('Queue empty after ' + Math.round(performance.now() - __qstart) + 'ms')
    }
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



/*
 *   Utility APIs
*/

/**
 * Pausing the engine will also stop render/tick events, etc.
 * @param paused
*/
Engine.prototype.setPaused = function (paused) {
    this._paused = !!paused
    // when unpausing, clear any built-up mouse inputs
    if (!paused) {
        this.inputs.state.dx = this.inputs.state.dy = 0
    }
}

/** @param x,y,z */
Engine.prototype.getBlock = function (x, y, z) {
    if (x.length) {
        return this.world.getBlockID(x[0], x[1], x[2])
    } else {
        return this.world.getBlockID(x, y, z)
    }
}

/** @param x,y,z */
Engine.prototype.setBlock = function (id, x, y, z) {
    // skips the entity collision check
    if (x.length) {
        return this.world.setBlockID(id, x[0], x[1], x[2])
    } else {
        return this.world.setBlockID(id, x, y, z)
    }
}

/**
 * Adds a block unless obstructed by entities
 * @param id,x,y,z */
Engine.prototype.addBlock = function (id, x, y, z) {
    // add a new terrain block, if nothing blocks the terrain there
    if (x.length) {
        if (this.entities.isTerrainBlocked(x[0], x[1], x[2])) return
        this.world.setBlockID(id, x[0], x[1], x[2])
    } else {
        if (this.entities.isTerrainBlocked(x, y, z)) return
        this.world.setBlockID(id, x, y, z)
    }
}



/** */
Engine.prototype.getPlayerPosition = function () {
    return this.entities.getPosition(this.playerEntity)
}

/** */
Engine.prototype.getPlayerMesh = function () {
    return this.entities.getMeshData(this.playerEntity).mesh
}

/** */
Engine.prototype.setPlayerEyeOffset = function (y) {
    this.playerEyeOffset = y
    var state = this.ents.getState(this.rendering.cameraTarget, this.ents.names.followsEntity)
    state.offset[1] = y
}

/** */
Engine.prototype.getPlayerEyePosition = function () {
    var pos = this.entities.getPosition(this.playerEntity)
    vec3.copy(_eyeLoc, pos)
    _eyeLoc[1] += this.playerEyeOffset
    return _eyeLoc
}
var _eyeLoc = vec3.create()

/** */
Engine.prototype.getCameraVector = function () {
    // rendering works with babylon's xyz vectors
    var v = this.rendering.getCameraVector()
    vec3.set(_camVec, v.x, v.y, v.z)
    return _camVec
}
var _camVec = vec3.create()



/**
 * Raycast through the world, returning a result object for any non-air block
 * @param pos
 * @param vec
 * @param dist
 */
Engine.prototype.pick = function (pos, vec, dist, blockIdTestFunction) {
    if (dist === 0) return null
    // if no block ID function is specified default to solidity check
    var testFn = blockIdTestFunction || this.registry.getBlockSolidity
    var world = this.world
    var testVoxel = function (x, y, z) {
        var id = world.getBlockID(x, y, z)
        return testFn(id)
    }
    pos = pos || this.getPlayerEyePosition()
    vec = vec || this.getCameraVector()
    dist = dist || this.blockTestDistance
    var rpos = _hitResult.position
    var rnorm = _hitResult.normal
    var hit = raycast(testVoxel, pos, vec, dist, rpos, rnorm)
    if (!hit) return null
    // position is right on a voxel border - adjust it so flooring will work as expected
    for (var i = 0; i < 3; i++) rpos[i] -= 0.01 * rnorm[i]
    return _hitResult
}
var _hitResult = {
    position: vec3.create(),
    normal: vec3.create(),
}







// Each frame, by default pick along the player's view vector
// and tell rendering to highlight the struck block face
function updateBlockTargets(noa) {
    var newhash = ''
    var blockIdFn = noa.blockTargetIdCheck || noa.registry.getBlockSolidity
    var result = noa.pick(null, null, null, blockIdFn)
    if (result) {
        var dat = _targetedBlockDat
        for (var i = 0; i < 3; i++) {
            // position values are right on a border, so adjust them before flooring!
            var n = result.normal[i] | 0
            var p = Math.floor(result.position[i])
            dat.position[i] = p
            dat.normal[i] = n
            dat.adjacent[i] = p + n
            newhash += '|' + p + '|' + n
        }
        dat.blockID = noa.world.getBlockID(dat.position[0], dat.position[1], dat.position[2])
        newhash += '|' + result.blockID
        noa.targetedBlock = dat
    } else {
        noa.targetedBlock = null
    }
    if (newhash != _prevTargetHash) {
        noa.emit('targetBlockChanged', noa.targetedBlock)
        _prevTargetHash = newhash
    }
}

var _targetedBlockDat = {
    blockID: 0,
    position: [],
    normal: [],
    adjacent: [],
}

var _prevTargetHash = ''










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
