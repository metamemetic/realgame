<template>
    <canvas id="renderCanvas" touch-action="none" style="height: 100vh; width: 100%"></canvas>
</template>

<script>
    import { mapGetters, mapMutations } from 'vuex'
    import * as BABYLON from 'babylonjs';
    import 'babylonjs-materials';
    import 'babylonjs-gui';

    export default {
        props: ['me'],

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
            console.log('Current user:', this.me)

            // Create the Babylon engine and attach to canvas
            var canvas = document.getElementById("renderCanvas");
            var engine = new BABYLON.Engine(canvas, true);

            // Create the scene space
            var scene = new BABYLON.Scene(engine);
            var assetsManager = new BABYLON.AssetsManager(scene);
            assetsManager.useDefaultLoadingScreen = false;
            var meshTask = assetsManager.addMeshTask("steve", "", "/models/", "steve.babylon");

            var STEVE_MODEL = BABYLON.Mesh.CreateCylinder("cone", 3, 3, 0, 6, 1, scene, false);
            STEVE_MODEL.visibility = 0

            meshTask.onSuccess = function (task) {
                console.log(task)
                var meshes = task.loadedMeshes
                meshes.forEach(mesh => {
                    mesh.parent = STEVE_MODEL
                    // mesh.scalingDeterminant = 0.1
                    mesh.isVisible = false

                    // mesh.scaling = new BABYLON.Vector3(0.5,0.5,0.5);
                    // mesh.visibility = 0
                })

                // console.log('so')
                // task.loadedMeshes[0].position = BABYLON.Vector3.Zero();

                // var m = task.loadedMeshes
                // m.isVisible = false
                //
                // STEVE_MODEL = task.loadedMeshes[0]
            }

            meshTask.onError = function (task, message, exception) {
                console.log(message, exception);
            }

            assetsManager.load()

            // Add a camera to the scene and attach it to the canvas
            var camera = new BABYLON.UniversalCamera("UniversalCamera", new BABYLON.Vector3(0, 6, 0), scene);
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

            var userId = this.me.id
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
                // let userShape = BABYLON.Mesh.CreateCylinder("cone", 3, 3, 0, 6, 1, scene, false);
                console.log('STEVE_MODEL', STEVE_MODEL)

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
                        user.id = userId
                        user.x = x
                        user.z = z
                        user.shape.position.x = x
                        user.shape.position.z = z
                        user.shape.rotation.y = ry + 270 * Math.PI / 180 // received rotatin plus 270deg rotation to handle the model starting rotated(?)

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
                    // user.shape.dispose()
                    // this.$store.state.users[user.id] = undefined
                    // user.tag.dispose()
                    // user.shape.visibility = 0
                    // user.tag.visibility = 0
                })
        }
    }
</script>

<style>
    canvas {
        outline: none;
    }
</style>
