<template>
    <canvas id="renderCanvas" touch-action="none" style="height: 100vh; width: 100%"></canvas>
</template>

<script>
    import * as BABYLON from 'babylonjs';
    import 'babylonjs-materials';    

    export default {
        mounted() {
            var canvas = document.getElementById("renderCanvas");
            var engine = new BABYLON.Engine(canvas, true);

            // Create the scene space
            var scene = new BABYLON.Scene(engine);

            // Add a camera to the scene and attach it to the canvas
            var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2.22, 2, new BABYLON.Vector3(0,2,0), scene);

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
        	shape.position = new BABYLON.Vector3(0, 15, 0);
            shape.visibility = 0
            camera.parent = shape;

            // Set up position animation
        	var posAnim = new BABYLON.Animation("pa", "position", 15,
        		BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

        	// Animation keys
        	var posKeys = [];
        	posKeys.push({ frame: 0, value: shape.position });
        	posKeys.push({ frame: 120, value: new BABYLON.Vector3(0, 0, -25) });
            posKeys.push({ frame: 838, value: new BABYLON.Vector3(0, 0, -500) });
        	posAnim.setKeys(posKeys);

        	// vars for all the available easing trajectories
        	var amplitude = 1;

        	var bounces = 3;
        	var bounciness = .1;

        	var oscillations = 1;
        	var springiness = 1;

        	var exponent = 5;
        	var power = 5;

        	// pre-make all available easings... for fun
        	var ef1 = new BABYLON.CircleEase();
        	var ef2 = new BABYLON.BackEase(amplitude);
        	var ef3 = new BABYLON.BounceEase(bounces, bounciness);
        	var ef4 = new BABYLON.CubicEase();
        	var ef5 = new BABYLON.ElasticEase(oscillations, springiness);
        	var ef6 = new BABYLON.ExponentialEase(exponent);
        	var ef7 = new BABYLON.PowerEase(power);
        	var ef8 = new BABYLON.QuadraticEase();
        	var ef9 = new BABYLON.QuarticEase();
        	var ef10 = new BABYLON.QuinticEase();
        	var ef11 = new BABYLON.SineEase();

        	// set some work variables... and easy place to change/test different easings
        	var posEase = ef11;

        	// For each easing function, you can choose between EASEIN (default), EASEOUT, or EASEINOUT
        	posEase.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

        	// Adding the easing functions to the animations
        	posAnim.setEasingFunction(posEase);

        	// Adding the animations to shape animations collection
        	shape.animations.push(posAnim);

        	// Finally, start all animations on shape7, from key 0 to key 838 with loop false
            scene.beginAnimation(shape, 0, 838, false);

            engine.runRenderLoop(function () {
                scene.render();
            });

            window.addEventListener("resize", function () {
                engine.resize();
            });
        }
    }
</script>

<style>
    canvas {
        outline: none;
    }
</style>
