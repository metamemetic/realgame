<template>
    <canvas id="renderCanvas" touch-action="none"></canvas>
</template>

<script>
    var engine = require('../arca')

    export default {
        mounted() {

            var arca = engine({
                playerHeight: 4,
                userControlsCamera: false, // todo
                // skipDefaultHighlighting: true
            })

            setTimeout(() => {
                for (let i = -10; i < 15; i++) {
                    arca.loadSchematic('road1', [30, 0, i * 18])
                }

                for (let i = -10; i < 15; i++) {
                    arca.loadSchematic('road2', [-11, -1, i * 18])
                }

                // rough wait for carMesh to load
                // get the player entity's ID and other info (aabb, size)
                var eid = arca.playerEntity
                var dat = arca.entities.getPositionData(eid)
                var w = dat.width
                var h = dat.height

                // make a Babylon.js mesh and scale it, etc.
                // var scene = noa.rendering.getScene()  // Babylon's "Scene" object
                // var mesh = BABYLON.Mesh.CreateBox('player', 1, scene)
                // mesh.scaling.x = mesh.scaling.z = w
                // mesh.scaling.y = h

                var mesh = window.carMesh

                // offset of mesh relative to the entity's "position" (center of its feet)
                var offset = [-5, h / 2 - 3, -8]

                // a "mesh" component to the player entity
                arca.entities.addComponent(eid, arca.entities.names.mesh, {
                	mesh: mesh,
                	offset: offset
                })


                // arca.loadSchematic('excalibur', [-75, 0, -15])
            }, 1000)

            arca.registry.registerMaterial('black_wool', null, '/models/tex/wool_colored_black.png')
            arca.registry.registerMaterial('diamond_block', null, '/models/tex/diamond_block.png')
            arca.registry.registerMaterial('white_stained_glass', null, '/models/tex/glass_white.png', true, 0.8)
            arca.registry.registerMaterial('black_stained_glass', null, '/models/tex/glass_black.png', true, 0.4)
            arca.registry.registerMaterial('quartz_block', null, '/models/tex/quartz_block_top.png')
            arca.registry.registerMaterial('purpur_block', null, '/models/tex/purpur_block.png')
            //
            // // register block types and their material name
            arca.registry.registerBlock(35, { material: 'black_wool' })
            arca.registry.registerBlock(57, { material: 'diamond_block' })
            arca.registry.registerBlock(95, { material: 'white_stained_glass', opaque: false })
            arca.registry.registerBlock(96, { material: 'black_stained_glass', opaque: false })
            arca.registry.registerBlock(155, { material: 'quartz_block' })
            arca.registry.registerBlock(201, { material: 'purpur_block' })

            // add a listener for when the engine requests a new world chunk
            // `data` is an ndarray - see https://github.com/scijs/ndarray
            arca.world.on('worldDataNeeded', function (id, data, x, y, z) {
            	// populate ndarray with world data (block IDs or 0 for air)
            	for (var i = 0; i < data.shape[0]; ++i) {
            		for (var k = 0; k < data.shape[2]; ++k) {
            			var height = 1
            			for (var j = 0; j < data.shape[1]; ++j) {
            				if (y + j < height) {
            					if (y + j < 0) data.set(i, j, k, 1)
            					else data.set(i, j, k, 1);
            				}
            			}
            		}
            	}
            	// pass the finished data back to the game engine
            	arca.world.setChunkData(id, data)
            })

            // on left mouse, set targeted block to be air
            arca.inputs.down.on('fire', function () {
            	if (arca.targetedBlock) arca.setBlock(0, arca.targetedBlock.position);
            })

            // on right mouse, place some grass
            arca.inputs.down.on('alt-fire', function () {
            	if (arca.targetedBlock) arca.addBlock(1, arca.targetedBlock.adjacent)
            })

            // add a key binding for "E" to do the same as alt-fire
            arca.inputs.bind('alt-fire', 'E')


            // each tick, consume any scroll events and use them to zoom camera
            var zoom = 0
            arca.on('tick', function (dt) {
            	var scroll = arca.inputs.state.scrolly
            	if (scroll === 0) return

            	// handle zoom controls
            	zoom += (scroll > 0) ? 1 : -1
            	if (zoom < 0) zoom = 0
            	if (zoom > 10) zoom = 10
            	arca.rendering.zoomDistance = zoom
            })



        }
    }
</script>

<style>
    canvas {
        outline: none;
        height: 100%;
        width: 100%;
        position: fixed;
        overflow: hidden;
    }
</style>
