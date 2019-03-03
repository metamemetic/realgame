<template>
    <canvas id="renderCanvas" touch-action="none" style="height: 100vh; width: 100%"></canvas>
</template>

<script>
    import * as BABYLON from 'babylonjs';
    import 'babylonjs-materials';
    import 'babylonjs-gui';

    export default {
        props: ['me'],
        data () {
            return {
                users: []
            }
        },
        mounted() {
            console.log('Current user:', this.me)

            // Create the Babylon engine and attach to canvas
            var canvas = document.getElementById("renderCanvas");
            var engine = new BABYLON.Engine(canvas, true);

            // Create the scene space
            var scene = new BABYLON.Scene(engine);

            // Add a camera to the scene and attach it to the canvas
            var camera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(0, 1, 0), scene);
            camera.setTarget(new BABYLON.Vector3(0, 1.5, -100));

            // Make the ground
            var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 1000, height: 1000}, scene);
            ground.material = new BABYLON.GridMaterial("groundMaterial", scene);

            // Add a hemispheric light
            var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        	light.intensity = 0.7;

            // Add skybox
        	var skyboxMaterial = new BABYLON.SkyMaterial("skyMaterial", scene);
            skyboxMaterial.backFaceCulling = false;
            var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000.0, scene);
            skybox.material = skyboxMaterial;

            // Initial sky config - https://doc.babylonjs.com/extensions/sky
            skyboxMaterial.inclination = 0.49
            skyboxMaterial.azimuth = 0.25

            // Add cone for user, make invisible, attach camera
            var shape = BABYLON.Mesh.CreateCylinder("cone", 3, 3, 0, 6, 1, scene, false);
        	shape.position = new BABYLON.Vector3(0, 1, 0);
            shape.rotation.y = Math.PI * 2
            shape.visibility = 0
            camera.parent = shape;

            // Run the render loop
            engine.runRenderLoop(function () {
                scene.render();
            });

            // Resize canvas properly on browser window resize
            window.addEventListener("resize", function () {
                engine.resize();
            });

            // Prepare to handle keyboard input
            var inputMap = {};
            scene.actionManager = new BABYLON.ActionManager(scene);
            scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
                inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
            }));
            scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
                inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
            }));

            // Defined how fast the user moves forward/back and turns
            var throttle = .15;
            var turnspeed = .03;

            // Game/Render loop
            scene.onBeforeRenderObservable.add(()=>{

                // Handle WASD movement
                if(inputMap["w"] || inputMap["ArrowUp"]){
                    shape.translate(BABYLON.Axis.Z, -throttle, BABYLON.Space.LOCAL)
                }
                if(inputMap["a"] || inputMap["ArrowLeft"]){
                    shape.rotation.y -= turnspeed;
                }
                if(inputMap["s"] || inputMap["ArrowDown"]){
                    shape.translate(BABYLON.Axis.Z, throttle, BABYLON.Space.LOCAL)
                }
                if(inputMap["d"] || inputMap["ArrowRight"]){
                    shape.rotation.y += turnspeed;
                }

                // Move username tags to current position of each user cone
                userShapes.forEach(shape => {
                    shape.tag.moveToVector3(new BABYLON.Vector3(shape.shape.position.x, 3.2, shape.shape.position.z), scene)
                })
            })

            var userId = this.me.id
            var userShapes = []
            var locationSendInterval = 1000 // Send location updates every X milliseconds

            // Set up the UI
            var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
            advancedTexture.idealWidth = 600;

            // Listen for user locations and update userShapes array with user object accordingly
            Echo.private('locations')
                .listenForWhisper('location', (e) => {
                    console.log('Location received:'); // , e
                    // console.log('userShapes:', userShapes)
                    if (userShapes[e.userId]) {
                        userShapes[e.userId].x = e.x
                        userShapes[e.userId].z = e.z
                        userShapes[e.userId].shape.position.x = e.x
                        userShapes[e.userId].shape.position.z = e.z
                    } else {
                        console.log('Could not find userShape with user id ' + e.userId)
                        makeShape(e.x, e.z, e.userId, 'Jimbo')
                    }

                });

            // Function to broadcast user location
            var sendLocation = function () {
                let x = Math.floor(shape.position.x * 10000) / 10000
                let z = Math.floor(shape.position.z * 10000) / 10000

                Echo.private('locations')
                    .whisper('location', {
                        x, z, userId
                    })

                setTimeout(sendLocation, locationSendInterval)
            }

            sendLocation()

            // Function to draw a new user cone with initial position
            var makeShape = function (x, z, userId, name) {
                console.log('making shape with name ' + name)
                let userShape = BABYLON.Mesh.CreateCylinder("cone", 3, 3, 0, 6, 1, scene, false);
                userShape.position = new BABYLON.Vector3(0, 1, 0);

                // Set up the initial username tag: a TextBlock inside an invisible rectangle
                var rect1 = new BABYLON.GUI.Rectangle();
                rect1.width = 0.2;
                rect1.height = "25px";
                rect1.cornerRadius = 20;
                rect1.thickness = 0;
                advancedTexture.addControl(rect1);

                var label = new BABYLON.GUI.TextBlock();
                label.text = name;
                label.color = "White"
                rect1.addControl(label);

                // Update the userShapes array with user object
                userShapes[userId] = {
                    name,
                    x,
                    z,
                    shape: userShape,
                    tag: rect1
                }
            }

            // Join the presence channel and handle others joining/leaving
            Echo.join('online')
                .here(users => (this.users = users))
                .joining(user => {
                    console.log('User joined:', user)
                    if (!userShapes[user.id]) {
                        makeShape(0, 0, user.id, user.name)
                    }
                })
                .leaving(user => {
                    console.log('User left:', user)
                })
        }
    }
</script>

<style>
    canvas {
        outline: none;
    }
</style>
