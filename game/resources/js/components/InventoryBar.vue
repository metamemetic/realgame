<template>
    <div class="inventory-container">
        <img src="/img/inventory-bar.png" class="inventory-bar-image" />
    </div>
</template>

<style>
    .inventory-container {
        position: fixed;
        text-align: center;
        color: white;
        width: 100%;
        bottom: 30px;
        left: 0;
        right: 0;
        z-index: 10;
    }

    .inventory-bar-image {
        image-rendering: pixelated;
        width: 800px;
    }
</style>
