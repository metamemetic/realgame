<template>
    <canvas id="renderCanvas" touch-action="none" style="height: 100vh; width: 100%"></canvas>
</template>

<script>
    import { mapGetters, mapMutations } from 'vuex'
    import * as BABYLON from 'babylonjs';
    import 'babylonjs-materials';
    import 'babylonjs-gui';

    export default {
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
            this.$store.commit('setAuthUser', window.auth_user);

            var engine = require('noa-engine')

            var noa = engine({
                playerHeight: 2.5
            })

            console.log('noa:', noa)

            let scene = noa.rendering.getScene()  // Babylon's "Scene" object
            var assetsManager = new BABYLON.AssetsManager(scene);
            assetsManager.useDefaultLoadingScreen = false;

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

            // register some block materials (just colors here)
            let textureURL = null // replace that to use a texture
            let brownish = [0.45, 0.36, 0.22]
            let greenish = [0.1, 0.8, 0.2]
            noa.registry.registerMaterial('dirt', brownish, textureURL)
            noa.registry.registerMaterial('grass', greenish, textureURL)

            // register block types and their material name
            let dirtID = noa.registry.registerBlock(1, { material: 'dirt' })
            let grassID = noa.registry.registerBlock(2, { material: 'grass' })

            // add a listener for when the engine requests a new world chunk
            // `data` is an ndarray - see https://github.com/scijs/ndarray
            noa.world.on('worldDataNeeded', function (id, data, x, y, z) {
                // console.log(id + ' - data ndarray right now is:', data)
            	// populate ndarray with world data (block IDs or 0 for air)
            	for (let i = 0; i < data.shape[0]; ++i) {
            		for (let k = 0; k < data.shape[2]; ++k) {
            			let height = getHeightMap(x + i, z + k)
            			for (let j = 0; j < data.shape[1]; ++j) {
            				if (y + j < height) {
            					if (y + j >= 0) {
                                    data.set(i, j, k, grassID);
                                }
            				}
            			}
            		}
            	}
            	// pass the finished data back to the game engine
            	noa.world.setChunkData(id, data)
            })

            // worldgen - return a heightmap for a given [x,z]
            function getHeightMap(x, z) {
            	let xs = 0.8 + Math.sin(x / 10)
            	let zs = 0.4 + Math.sin(z / 15 + x / 30)
            	return xs + zs
            }

            let player = require('../player')({
              	// Pass it a copy of the Babylon scene
            	scene: scene,

            	// Pass it the initial player color
            	player_color: new BABYLON.Color4(0,0,255,0.8),

            	// Pass it mesh height
            	player_height: 1.5,
            });

            let player_mesh = player.get_player_mesh();
            player_mesh.scaling.x = 0.65;
            player_mesh.scaling.y = 0.65;
            player_mesh.scaling.z = 0.65;

            // Add a player component to the player entity
            noa.entities.addComponent(noa.playerEntity, noa.entities.names.mesh, {
            	mesh: player_mesh,
            	offset: [0, player.get_player_height(), 0],
            })

            // Allow player mesh to be seen when in first person
            noa.ents.getState(noa.playerEntity, noa.ents.names.fadeOnZoom).cutoff = 0.0;

            // Rotate player with camera
            scene.registerBeforeRender(function () {
                noa.entities.getMeshData(noa.playerEntity).mesh.rotation.y = noa.rendering.getCameraRotation()[1];
                player.update_particles();
            });

            // on left mouse, set targeted block to be air
            noa.inputs.down.on('fire', function () {
            	if (noa.targetedBlock) {
            		noa.setBlock(0, noa.targetedBlock.position);
            	}
            })

            // Add Player movement animation
            document.onkeyup = function(e) {
            	if (['87', '65', '83', '68', '37', '38', '39', '40'].indexOf(e.keyCode.toString()) > -1) {
            	    if (player.is_walking()) {
            	        player.stop_walking();
            	    }
            	}
            };

            document.onkeydown = function(e) {
                if (['87', '65', '83', '68', '37', '38', '39', '40'].indexOf(e.keyCode.toString()) > -1) {
                    if (!player.is_walking()) {
                        player.start_walking();
                    }
                }
            };

            // on right mouse, place some grass
            noa.inputs.down.on('alt-fire', function () {
            	if (noa.targetedBlock) noa.addBlock(grassID, noa.targetedBlock.adjacent)
            })

            // add a key binding for "E" to do the same as alt-fire
            noa.inputs.bind('alt-fire', 'E')

            // each tick, consume any scroll events and use them to zoom camera
            let zoom = 0
            let minZoom = 0.1
            let maxZoom = 10

            noa.on('tick', function (dt) {
            	let scroll = noa.inputs.state.scrolly
            	if (scroll === 0) return

            	// handle zoom controls
            	zoom += (scroll > 0) ? 1 : -1
            	if (zoom < minZoom) zoom = minZoom
            	if (zoom > maxZoom) zoom = maxZoom
            	noa.rendering.zoomDistance = zoom
            })

            var userId = this.$store.state.user
                ? this.$store.state.user.id
                : null
            var locationSendInterval = 1000 // Send location updates every X milliseconds

            // Function to broadcast user location
            var sendLocation = function () {
                let x = Math.floor(player_mesh.position.x * 10000) / 10000
                let y = Math.floor(player_mesh.position.y * 10000) / 10000
                let z = Math.floor(player_mesh.position.z * 10000) / 10000

                let ry = Math.floor(player_mesh.rotation.y * 10000) / 10000

                // console.log(x, y, z, ry)

                Echo.private('locations')
                    .whisper('location', {
                        ry, x, y, z, userId
                    })

                setTimeout(sendLocation, locationSendInterval)
            }

            // Start the sendLocation loop
            sendLocation()

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
