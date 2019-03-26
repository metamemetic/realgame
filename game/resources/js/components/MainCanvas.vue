<template>
    <canvas id="renderCanvas" touch-action="none"></canvas>
</template>

<script>
    var engine = require('../arca')

    export default {
        mounted() {

            var arca = engine({
                userControlsCamera: false
            })

            console.log(arca)

            arca.setVoxel({
                x: 0,
                y: 0,
                z: 0,
                r: 255,
                g: 77,
                b: 255,
                a: 1
            })

            arca.setVoxel({
                x: 0,
                y: 10,
                z: -5,
                r: 255,
                g: 77,
                b: 41,
                a: 1
            })

            arca.setVoxel({
                x: 0,
                y: 4,
                z: -2,
                r: 255,
                g: 77,
                b: 41,
                a: 1
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
