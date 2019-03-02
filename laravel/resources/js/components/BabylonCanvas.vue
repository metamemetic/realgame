<template>
    <canvas id="renderCanvas" touch-action="none" style="height: 100vh; width: 100%"></canvas>
</template>

<script>
    import * as BABYLON from 'babylonjs';
    import 'babylonjs-materials';

    export default {
        data () {
            return {
                users: []
            }
        },
        mounted() {
            function onNewGamepadConnected(gamepad) {
                console.log('what this gamepad', gamepad)
            }

            var canvas = document.getElementById("renderCanvas");
            var engine = new BABYLON.Engine(canvas, true);

            // Create the scene space
            var scene = new BABYLON.Scene(engine);

            // Add a camera to the scene and attach it to the canvas
            // var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2.22, 2, new BABYLON.Vector3(0,1,0), scene);
            var camera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(0, 1, -10), scene);
            camera.setTarget(new BABYLON.Vector3(0,1.5,-100));
            camera.attachControl(canvas, true);


            // Make the ground
            var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 1000, height: 1000}, scene);
            ground.material = new BABYLON.GridMaterial("groundMaterial", scene);

            // Try a light from the playground w cone
            var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        	light.intensity = 0.7;

            // Sky material
        	var skyboxMaterial = new BABYLON.SkyMaterial("skyMaterial", scene);
            skyboxMaterial.backFaceCulling = false;

        	// Sky mesh (box)
            var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000.0, scene);
            skybox.material = skyboxMaterial;

            function rotateVector(vect, quat) {
                var matr = new BABYLON.Matrix();
                quat.toRotationMatrix(matr);
                var rotatedvect = BABYLON.Vector3.TransformCoordinates(vect, matr);
                return rotatedvect;
            }

            var setSkyConfig = function (property, from, to) {
        		var keys = [
                    { frame: 0, value: from },
                    { frame: 120, value: from },
        			{ frame: 520, value: to }
                ];

        		var animation = new BABYLON.Animation("animation", property, 100, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        		animation.setKeys(keys);

        		scene.stopAnimation(skybox);
        		scene.beginDirectAnimation(skybox, [animation], 0, 520, false, 1);
        	};

            // Initial sky config - https://doc.babylonjs.com/extensions/sky
            skyboxMaterial.inclination = 0.49
            skyboxMaterial.azimuth = 0.25

            // Add cone, make invisible, attach camera
            var shape = BABYLON.Mesh.CreateCylinder("cone", 3, 3, 0, 6, 1, scene, false);
        	shape.position = new BABYLON.Vector3(0, 1, 0);
            shape.rotation.y = Math.PI * 2

            shape.visibility = 0
            camera.parent = shape;

            engine.runRenderLoop(function () {
                scene.render();
            });

            window.addEventListener("resize", function () {
                engine.resize();
            });

            var inputMap = {};
            scene.actionManager = new BABYLON.ActionManager(scene);
            scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
                inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
            }));
            scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
                inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
            }));


            // // Game/Render loop
            scene.onBeforeRenderObservable.add(()=>{
                if(inputMap["w"] || inputMap["ArrowUp"]){
                    shape.position.z-=0.1
                }
                if(inputMap["a"] || inputMap["ArrowLeft"]){
                    shape.position.x+=0.1
                }
                if(inputMap["s"] || inputMap["ArrowDown"]){
                    shape.position.z+=0.1
                }
                if(inputMap["d"] || inputMap["ArrowRight"]){
                    shape.position.x-=0.1
                }
            })

            Echo.private('locations')
                .listenForWhisper('location', (e) => {
                    console.log('Location received:', e);
                });

            var sendLocation = function () {
                let x = Math.floor(shape.position.x * 100) / 100
                let z = Math.floor(shape.position.z * 100) / 100

                Echo.private('locations')
                    .whisper('location', {
                        x, z, userId: 123
                    })

                console.log('Sending location: ', x, z)
                setTimeout(sendLocation, 3000)
            }

            sendLocation()

            Echo.join('online')
                .here(users => (this.users = users))
                .joining(user => {
                    console.log('User joined:', user)
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
