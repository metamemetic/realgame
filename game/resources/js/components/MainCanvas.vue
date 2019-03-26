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

        }
    }
</script>

<style>
    canvas {
        outline: none;
        touch-action: none;
        height: 100%; 
        width: 100%;
        position: fixed;
        overflow: hidden;
    }
</style>
