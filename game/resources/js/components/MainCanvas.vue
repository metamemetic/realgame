<template>
    <canvas id="renderCanvas" touch-action="none" style="height: 100vh; width: 100%"></canvas>
</template>

<script>
    var engine = require('../arca')
    var arca = engine({
        userControlsCamera: false
    })

    export default {
        mounted() {
            console.log(arca)
        }
    }
</script>

<style>
    canvas {
        outline: none;
    }
</style>
