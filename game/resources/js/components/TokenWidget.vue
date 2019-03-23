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
    async mounted() {
        if (typeof window.ethereum !== 'undefined') {
            console.log('window.ethereum:', window.ethereum)
            const accounts = await ethereum.enable()
            const account = accounts[0]
            console.log(account)

            const tokenAddress = '0xb581e3a7db80fbaa821ab39342e9cbfd2ce33c23'
            const tokenSymbol = 'ARCD'
            const decimals = 18
            const tokenImage = 'https://arcade.city/images/token-sq.png'

            ethereum.sendAsync({
                method: 'wallet_watchAsset',
                params: {
                  "type":"ERC20",
                  "options":{
                    "address": tokenAddress,
                    "symbol": tokenSymbol,
                    "decimals": decimals,
                    "image": tokenImage,
                  },
                },
                id: Math.round(Math.random() * 100000),
            }, (err, added) => {

              if (added) {
                console.log('Thanks for your interest!')
              } else {
                console.log('Your loss!')
              }

            })


        } else {
            console.log('Not using MetaMask')
        }
    }
}
</script>
