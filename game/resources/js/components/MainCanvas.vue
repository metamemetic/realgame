<template>
    <canvas id="renderCanvas" touch-action="none"></canvas>
</template>

<script>
    var engine = require('../arca')

    export default {
        mounted() {

            var arca = engine({
                userControlsCamera: false, // todo
                // skipDefaultHighlighting: true
            })

            setTimeout(() => {
                arca.loadSchematic('pyramid')
            }, 500)

            // add a listener for when the engine requests a new world chunk
            // `data` is an ndarray - see https://github.com/scijs/ndarray
            arca.world.on('worldDataNeeded', function (id, data, x, y, z) {
            	// populate ndarray with world data (block IDs or 0 for air)
            	for (var i = 0; i < data.shape[0]; ++i) {
            		for (var k = 0; k < data.shape[2]; ++k) {
            			var height = getHeightMap(x + i, z + k)
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

            // worldgen - return a heightmap for a given [x,z]
            function getHeightMap(x, z) {
            	var xs = 0.8 + Math.sin(x / 10)
            	var zs = 0.4 + Math.sin(z / 15 + x / 30)
            	return (xs + zs) / 8
            }


            // on left mouse, set targeted block to be air
            arca.inputs.down.on('fire', function () {
            	if (arca.targetedBlock) arca.setBlock(0, arca.targetedBlock.position);
            })

            // on right mouse, place some grass
            arca.inputs.down.on('alt-fire', function () {
            	if (arca.targetedBlock) arca.addBlock(grassID, arca.targetedBlock.adjacent)
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
