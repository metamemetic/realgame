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

    var canvas = document.getElementById('renderCanvas');

    // load the 3D engine
    var engine = new BABYLON.Engine(canvas, true);

    // createScene function that creates and return the scene
    var createScene = function() {
        // create a basic BJS Scene object
        var scene = new BABYLON.Scene(engine);

        // create a FreeCamera, and set its position to (x:0, y:5, z:-10)
        var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 5, -10), scene);

        // target the camera to scene origin
        camera.setTarget(BABYLON.Vector3.Zero());

        // attach the camera to the canvas
        camera.attachControl(canvas, false);

        // create a basic light, aiming 0,1,0 - meaning, to the sky
        var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);

        // create a built-in "sphere" shape; its constructor takes 6 params: name, segment, diameter, scene, updatable, sideOrientation
        var sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene);

        // move the sphere upward 1/2 of its height
        sphere.position.y = 1;

        // create a built-in "ground" shape;
        var ground = BABYLON.Mesh.CreateGround('ground1', 6, 6, 2, scene);

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

    scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
            case BABYLON.PointerEventTypes.POINTERDOWN:
                console.log("POINTER DOWN");
                break;
            case BABYLON.PointerEventTypes.POINTERUP:
                console.log("POINTER UP");
                break;
            case BABYLON.PointerEventTypes.POINTERMOVE:
                console.log("POINTER MOVE");
                break;
            case BABYLON.PointerEventTypes.POINTERWHEEL:
                console.log("POINTER WHEEL");
                break;
            case BABYLON.PointerEventTypes.POINTERPICK:
                console.log("POINTER PICK");
                break;
            case BABYLON.PointerEventTypes.POINTERTAP:
                console.log("POINTER TAP");
                break;
            case BABYLON.PointerEventTypes.POINTERDOUBLETAP:
                console.log("POINTER DOUBLE-TAP");
                break;
        }
    });

    console.log('Arca initialized with opts:', opts)
}
