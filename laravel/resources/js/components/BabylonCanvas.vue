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
            shape.rotation.y = 2*Math.PI/2

            shape.visibility = 0
            // camera.parent = shape;

            engine.runRenderLoop(function () {
                scene.render();
            });

            window.addEventListener("resize", function () {
                engine.resize();
            });

            // var inputMap ={};
            // scene.actionManager = new BABYLON.ActionManager(scene);
            // scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
            //     inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
            // }));
            // scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
            //     inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
            // }));
            //

            // var diffAngle;
            // var pickResult;
            // var manState = 'idle';
            // var pickResultPos = new BABYLON.Vector3(0,0,0);
            // var dirvec = new BABYLON.Vector3(0,0,0);
            // var dirveckback = new BABYLON.Vector3(0,0,0);
            // var forwardvec = new BABYLON.Vector3(0,0,0);
            // var pickResultPosClicked = new BABYLON.Vector3(0,0,100);
            //
            // // Game/Render loop
            // scene.onBeforeRenderObservable.add(()=>{
            //     //vector forward direction
            //     // var forward = camera.getFrontPosition(1).subtract(shape.position);
            //     // forward.y = 0;
            //
            //     // var target = shape.position.clone();
            //     // var forward = target.subtract(camera.position).normalize();
            //
            //     var cameraForwardRayPosition = camera.getForwardRay().direction;
            //     var cameraForwardRayPositionWithoutY = new BABYLON.Vector3(cameraForwardRayPosition.x, 0, cameraForwardRayPosition.z);
            //
            //     console.log(cameraForwardRayPositionWithoutY)
            //
            //     //get rotation dir
            //     // var diffAngle = Math.atan2(forward.x,forward.z);
            //     // console.log(diffAngle)
            //
            //     if(inputMap["w"] || inputMap["ArrowUp"]){
            //
            //         shape.lookAt(shape.position.add(cameraForwardRayPositionWithoutY), 0, 0, 0);
            //
            //         // console.log('w hit. Forward is now:', forward)
            //         // shape.rotation.y = diffAngle + (Math.PI);
            //         // camera.rotation.y = diffAngle + (Math.PI);
            //         // shape.position.z+=0.1
            //
            //         var v2 = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(0, 0, -0.02), BABYLON.Matrix.RotationY(shape.rotation.y));
            //         shape.position.addInPlace(v2);
            //     }
            //     if(inputMap["a"] || inputMap["ArrowLeft"]){
            //         shape.position.x-=0.1
            //         // shape.rotation.y = diffAngle + (Math.PI/2);
            //     }
            //     if(inputMap["s"] || inputMap["ArrowDown"]){
            //         shape.position.z-=0.1
            //         // shape.rotation.y = diffAngle;
            //     }
            //     if(inputMap["d"] || inputMap["ArrowRight"]){
            //         shape.position.x+=0.1
            //         // shape.rotation.y = diffAngle - (Math.PI/2);
            //     }
            // })

            // function mousemovef(){
            //     var forward = camera.getFrontPosition(1).subtract(shape.position);
            //     forward.y = 0;
            //     console.log('Moved mouse. Forward is now:', forward)
            // 	pickResult = scene.pick(scene.pointerX, scene.pointerY);
            // 	if (pickResult.hit) {
            // 			if (manState != 'moving'){
            // 				pickResultPos.x = pickResult.pickedPoint.x;
            // 				pickResultPos.z = pickResult.pickedPoint.z;
            // 				var diffX = pickResultPos.x - shape.position.x;
            // 				var diffZ = pickResultPos.z - shape.position.z;
            // 				diffAngle = Math.atan2(-diffX,-diffZ);
            //                 forwardvec.x = (diffX);
            //                 forwardvec.z = (diffZ);
            // 			} // if not moving
            // 	}// if result
            // }//mousemovef()
            //
            // window.addEventListener("mousemove", function() {
    	    //        mousemovef();
            // });

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
