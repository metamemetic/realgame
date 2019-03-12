<template>
    <canvas id="renderCanvas" touch-action="none" style="height: 100vh; width: 100%"></canvas>
</template>

<script>
    import { mapGetters, mapMutations } from 'vuex'
    import * as BABYLON from 'babylonjs';
    import 'babylonjs-materials';
    import 'babylonjs-gui';

    export default {
        mounted() {
            var engine = require('noa-engine')

            var noa = engine({
                playerHeight: 2.5
            })

            console.log('noa:', noa)

            let scene = noa.rendering.getScene()  // Babylon's "Scene" object

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
            	// populate ndarray with world data (block IDs or 0 for air)
            	for (let i = 0; i < data.shape[0]; ++i) {
            		for (let k = 0; k < data.shape[2]; ++k) {
            			let height = getHeightMap(x + i, z + k)
            			for (let j = 0; j < data.shape[1]; ++j) {
            				if (y + j < height) {
            					if (y + j < 0) data.set(i, j, k, dirtID)
            					else data.set(i, j, k, grassID);
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

        }
    }
</script>

<style>
    canvas {
        outline: none;
    }
</style>
