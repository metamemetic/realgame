<template>
    <canvas id="renderCanvas" touch-action="none" style="height: 100vh; width: 100%"></canvas>
</template>

<script>
    import { mapGetters, mapMutations } from 'vuex'
    import * as BABYLON from 'babylonjs';
    import 'babylonjs-materials';
    import 'babylonjs-gui';

    var vox = require('vox.js')
    var engine = require('../arca')

    export default {
        mounted() {
            console.log(engine)

            // var arca = engine({
            //     playerHeight: 2.5
            // })
        },

        methods: {

            renderVoxAt(voxFile, position = [0, 0, 0]) {

                let parser = new vox.Parser()
                parser.parse("models/" + voxFile + ".vox").then(function(voxelData) {
                    console.log(voxelData.size)
                    let voxels = voxelData.voxels
                    let palette = voxelData.palette

                    let colorId = 1
                    let theColor

                    palette.forEach(color => {
                        // console.log(colorId, color)

                        if (colorId < 256) {
                            theColor = [color.r / 255, color.g / 255, color.b / 255, color.a / 255]

                            // noa.registry.registerMaterial('palette' + colorId, theColor, null)
                            // noa.registry.registerBlock(colorId, { material: 'palette' + colorId })
                            colorId++
                        }
                    })

                    voxels.forEach(voxel => {
                        // console.log('Placeholder for placing voxel')
                        // noa.world.setBlockID(voxel.colorIndex + 1, voxel.x + position[0], voxel.z + position[1], voxel.y + position[2])
                    })

                });
            },

            loadSchematic(model = 'pyramid') {
                this.loadSchematicFile('/models/' + model + '.schematic',
                     function(data) {

                         nbt.parse(new Buffer(data), function(error, data) {
                             if (error) { throw error; }

                             console.log("DATA:", data)
                         });

                         // Schematic.loadSchematic(new Buffer(data), function(u, s){
                         //     console.log(u)
                         //     console.log(s)
                         // });

                         // Schematic.parse(new Buffer(data), function (err, schem) {
                         //     console.log(schem.getBlock(0, 0, 0));
                         //     console.log('width:', schem.width)    // x
                         //     console.log('height:', schem.height)  // y
                         //     console.log('length:', schem.length)  // z
                         //
                         // });

                         // console.log('we found data', data)

                         // data.forEach(block => {
                         //     // console.log(block)
                         //
                         //     noa.world.setBlockID(2, block.x, block.y - 15, block.z)
                         // })
                     },
                     function(xhr) { console.error(xhr); }
                );
            },

            loadModel(model = 'pyramid') {
                this.loadJSON('/models/' + model + '.json',
                         function(data) {

                             data.forEach(block => {
                                 // console.log(block)

                                 noa.world.setBlockID(2, block.x, block.y - 15, block.z)
                             })
                         },
                         function(xhr) { console.error(xhr); }
                );
            },

            loadFile(path, success, error)
            {
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function()
                {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        if (xhr.status === 200) {
                            if (success)
                                success(xhr.responseText);
                        } else {
                            if (error)
                                error(xhr);
                        }
                    }
                };
                xhr.open("GET", path, false);
                xhr.send();
            },

            loadJSON(path, success, error)
            {
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function()
                {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        if (xhr.status === 200) {
                            if (success)
                                success(JSON.parse(xhr.responseText));
                        } else {
                            if (error)
                                error(xhr);
                        }
                    }
                };
                xhr.open("GET", path, false);
                xhr.send();
            },

            renderBuilding() {
                let platformWidth = 120
                let platformLength = 120

                // Starting platform
                for (let x = -platformWidth * 0.5; x < platformWidth * 0.5; x++) {
                    for (let z = -platformLength * 0.5; z < platformLength * 0.5; z++) {
                        noa.world.setBlockID(1, x, -15, z)
                    }
                }
            }
        }
    }
</script>

<style>
    canvas {
        outline: none;
    }
</style>
