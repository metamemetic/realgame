<template>
    <canvas id="renderCanvas" touch-action="none"></canvas>
</template>

<script>
    var engine = require('../arca')

    export default {
        mounted() {

            var arca = engine({
                userControlsCamera: false, // todo
                skipDefaultHighlighting: true
            })

            arca.loadModel({
                vox: 'bluecar1',
                x: -30,
                y: 0,
                z: -50
            })

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
