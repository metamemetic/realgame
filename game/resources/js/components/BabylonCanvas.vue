<template>
    <canvas id="renderCanvas" touch-action="none" style="height: 100vh; width: 100%"></canvas>
</template>

<script>
    import { mapGetters, mapMutations } from 'vuex'
    import * as BABYLON from 'babylonjs';
    import 'babylonjs-materials';
    import 'babylonjs-gui';
    import 'babylonjs-loaders';

    export default {
        // props: ['me'],

        computed: {
            users() {
                return window.store.state.users
            }
        },

        methods: {
            ...mapGetters([
                'getUserById',
                'getUsers'
            ]),

            ...mapMutations([
                'setUser',
                'setUsers',
                'removeUserById'
            ])
        },

        mounted() {
            // console.log('Current user:', this.me)

            this.$store.commit('setAuthUser', window.auth_user);

            // Create the Babylon engine and attach to canvas
            var canvas = document.getElementById("renderCanvas");
            var engine = new BABYLON.Engine(canvas, true);

            // Create the scene space
            var scene = new BABYLON.Scene(engine);
            var assetsManager = new BABYLON.AssetsManager(scene);
            assetsManager.useDefaultLoadingScreen = true;
            var meshTask = assetsManager.addMeshTask("steve", "", "/models/", "steve.babylon");

            var STEVE_MODEL = BABYLON.Mesh.CreateCylinder("cone", 3, 3, 0, 6, 1, scene, false);
            STEVE_MODEL.visibility = 0

            var BUILDING_MODEL = BABYLON.Mesh.CreateCylinder("cone", 3, 3, 0, 6, 1, scene, false);
            BUILDING_MODEL.visibility = 0

            meshTask.onSuccess = function (task) {
                console.log(task)
                var meshes = task.loadedMeshes
                meshes.forEach(mesh => {
                    mesh.parent = STEVE_MODEL
                    mesh.isVisible = false
                })
            }

            meshTask.onError = function (task, message, exception) {
                console.log(message, exception);
            }

            var meshTask2 = assetsManager.addMeshTask("tester", "", "/models/", "tester.obj");

            meshTask2.onSuccess = function (task) {
                console.log(task)
                console.log('Loaded Test1?!')


                var meshes = task.loadedMeshes
                meshes.forEach(mesh => {
                    mesh.parent = BUILDING_MODEL
                    // mesh.isVisible = false
                })

                // var building = task.loadedMeshes[0]
                // console.log('Current building position:', building.position.x, building.position.y, building.position.z)
                // building.position.x = 50
                // building.position.y = 50
                // building.position.z = 50
                // console.log('Current building position:', building.position.x, building.position.y, building.position.z)


                BUILDING_MODEL.position.x = 100
                BUILDING_MODEL.position.y = 0
                BUILDING_MODEL.position.z = 100
            }

            assetsManager.load()

            // Add a camera to the scene and attach it to the canvas
            var camera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(0, 6, 0), scene);
            // var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
            camera.attachControl(canvas, true);

            camera.keysUp.push(87); // "w"
            camera.keysDown.push(83); // "s"
            camera.keysLeft.push(65);
            camera.keysRight.push(68);

            // camera.setTarget(new BABYLON.Vector3(0, 1.5, -100));

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
            shape.rotation.y = Math.PI // Math.PI * 2
            shape.visibility = 0
            // camera.parent = shape;

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
                    shape.translate(BABYLON.Axis.Z, throttle, BABYLON.Space.LOCAL)
                }
                if(inputMap["a"] || inputMap["ArrowLeft"]){
                    shape.rotation.y -= turnspeed;
                }
                if(inputMap["s"] || inputMap["ArrowDown"]){
                    shape.translate(BABYLON.Axis.Z, -throttle, BABYLON.Space.LOCAL)
                }
                if(inputMap["d"] || inputMap["ArrowRight"]){
                    shape.rotation.y += turnspeed;
                }

                var users = this.getUsers()

                // Move username tags to current position of each user cone
                users.forEach(user => {
                    if (user && user.tag && user.shape) {
                        user.tag.moveToVector3(new BABYLON.Vector3(user.shape.position.x, 10.5, user.shape.position.z), scene)
                    }
                })
            })

            var userId = this.$store.state.user
                ? this.$store.state.user.id
                : null
            var userShapes = []
            var locationSendInterval = 1000 // Send location updates every X milliseconds

            // Set up the UI
            var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
            advancedTexture.idealWidth = 600;

            // Function to broadcast user location
            var sendLocation = function () {
                let x = Math.floor(shape.position.x * 10000) / 10000
                let z = Math.floor(shape.position.z * 10000) / 10000

                let ry = Math.floor(shape.rotation.y * 10000) / 10000

                Echo.private('locations')
                    .whisper('location', {
                        ry, x, z, userId
                    })

                setTimeout(sendLocation, locationSendInterval)
            }

            // Start the sendLocation loop
            sendLocation()

            // Function to draw a new user cone with initial position
            let makeShape = (x, z, user) => { // , that
                let userShape = STEVE_MODEL.clone(STEVE_MODEL.name)

                userShape._children.forEach(child => {
                    child.isVisible = true
                })

                userShape.position = new BABYLON.Vector3(0, 1, 0);
                userShape.isVisible = true

                // Set up the initial username tag: a TextBlock inside an invisible rectangle
                var rect1 = new BABYLON.GUI.Rectangle();
                rect1.width = 0.2;
                rect1.height = "25px";
                rect1.cornerRadius = 20;
                rect1.thickness = 0;
                advancedTexture.addControl(rect1);

                var label = new BABYLON.GUI.TextBlock();
                label.text = user.name;
                label.color = "White"
                rect1.addControl(label);

                user.shape = userShape
                user.tag = rect1

                this.setUser(user)
                console.log('Added new shape to user:', user)
            }

            // Listen for user locations and update user store with user object accordingly
            Echo.private('locations')
                .listenForWhisper('location', (e) => {
                    const { ry, x, z, userId } = e

                    let userGetter = this.getUserById(userId)
                    const user = userGetter(userId)

                    if (user && user.shape) {
                        user.shape.animations = [];
                        user.id = userId

                        var positionInterpolate = new BABYLON.Animation("positionInterpolate", "position", 30,
                            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
                        );

                        var rotationInterpolate = new BABYLON.Animation("positionInterpolate", "rotation.y", 30,
                            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
                        );

                        var positionKeys = [];

                        positionKeys.push({
                          frame: 0,
                          value: user.shape.position,
                        });

                        positionKeys.push({
                          frame: 30,
                          value: new BABYLON.Vector3(
                              x,
                              user.shape.position.y,
                              z
                          ),
                        });

                        var rotationKeys = []

                        rotationKeys.push({
                            frame: 0,
                            value: user.shape.rotation.y
                        })

                        rotationKeys.push({
                            frame: 30,
                            value: ry - 90 * Math.PI / 180 // received rotatin plus 270deg rotation to handle the model starting rotated(?)
                        })

                        positionInterpolate.setKeys(positionKeys);
                        rotationInterpolate.setKeys(rotationKeys);

                        user.shape.animations.push(positionInterpolate);
                        user.shape.animations.push(rotationInterpolate);

                        scene.beginAnimation(user.shape, 0, 30, false);

                        this.setUser(user)
                    } else if (user) {
                        makeShape(x, z, user)
                    } else {
                        console.log('WAT HAPPEN')
                    }
                });

            // Join the presence channel and handle others joining/leaving
            Echo.join('online')
                .here(users => this.setUsers(users))
                .joining(user => {
                    console.log('User joined:', user)
                    if (!this.$store.state.users[user.id]) {
                        makeShape(0, 0, user)
                    }
                })
                .leaving(user => {
                    console.log('User left:', user)
                    this.removeUserById(user.id)
                })
        }
    }
</script>

<style>
    canvas {
        outline: none;
    }
</style>
