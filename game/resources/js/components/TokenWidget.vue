<template>
    <div class="token-widget-container">
        0 Tokens
    </div>
</template>

<style>
    .token-widget-container {
        position: fixed;
        text-align: center;
        color: white;
        width: 200px;
        top: 25px;
        right: 15px;
        z-index: 10;
        font-family: monospace;
        font-size: 16px;
    }

    /* .inventory-bar-image {
        image-rendering: pixelated;
        width: 800px;
        max-width: 90%;
    } */
</style>

<script>

export default {
    mounted() {
        if (typeof window.ethereum !== 'undefined') {
            console.log('window.ethereum:', window.ethereum)
        } else {
            console.log('Not using MetaMask')
        }
    }
}
</script>
