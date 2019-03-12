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
                inverseY: true
            })

            console.log('noa:', noa)
        }
    }
</script>

<style>
    canvas {
        outline: none;
    }
</style>
