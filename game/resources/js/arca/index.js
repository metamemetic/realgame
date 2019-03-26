/**
 * Arca: Lightweight voxel engine built on BabylonJS, inspired by noa-engine
 */

var extend = require('extend')  // Extend one object with one or more others, returning the modified object
var voxjs = require('vox.js')   // MagicaVoxel file parser

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

    var canvas = document.getElementById('renderCanvas');

    // load the 3D engine
    var engine = new BABYLON.Engine(canvas, true);

    // createScene function that creates and return the scene
    var createScene = function() {
        // create a basic BJS Scene object
        var scene = new BABYLON.Scene(engine);

        this.scene = scene

        // create a FreeCamera, and set its position to (x:0, y:5, z:-10)
        var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), scene);

        // target the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());

        // attach the camera to the canvas
        camera.attachControl(canvas, false);

        // create a basic light, aiming 0,1,0 - meaning, to the sky
        var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);

        // create a built-in "ground" shape;
        // var ground = BABYLON.Mesh.CreateGround('ground1', 6, 6, 2, scene);

        // return the created scene
        return scene;
    }

    // call the createScene function
    var scene = createScene();

    // run the render loop
    engine.runRenderLoop(function() {
        scene.render();
    });

    // the canvas/window resize event handler
    window.addEventListener('resize', function() {
        engine.resize();
    });



    console.log('Arca initialized with opts:', opts)
}


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
        // console.log('Size:', voxelData.size)
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
            if (numVoxels < 500) {
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
