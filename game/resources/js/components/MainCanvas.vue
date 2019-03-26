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

            // arca.loadModel({
            //     vox: 'excalibur2',
            //     x: 0,
            //     y: 0,
            //     z: 0
            // })

            arca.loadModel({
                vox: 'chr_old',
                x: 0,
                y: -5,
                z: 5
            })

            arca.loadModel({
                vox: 'chr_knight',
                x: 20,
                y: -5,
                z: 5
            })

            arca.loadModel({
                vox: 'chr_rain',
                x: -15,
                y: -5,
                z: 5
            })

            arca.loadModel({
                vox: 'chr_sword',
                x: -32,
                y: -5,
                z: 5
            })

            // arca.loadModel({
            //     vox: 'castle',
            //     x: -12,
            //     y: 5,
            //     z: 15
            // })

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
