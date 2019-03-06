<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>Arcade City</title>
        <link rel="stylesheet" type="text/css" href="css/demo.css" />
        <link rel="stylesheet" type="text/css" href="css/style4.css" />

        <style>
            html, body {
                background-color: #000;
                color: #fff;
                font-family: monospace;
                font-weight: 200;
                height: 100vh;
                margin: 0;
            }

            .overlay {
                background-color: rgba(0,0,0,0.6);
                position: fixed;
                width: 100%;
                height: 100%;
                top: 0px;
                left: 0px;
                z-index: 3;
            }

            .full-height {
                height: 100vh;
            }

            .flex-center {
                align-items: center;
                display: flex;
                justify-content: center;
            }
            .position-ref {
                position: relative;
            }
            .top-right {
                position: absolute;
                right: 10px;
                top: 18px;
            }
            .content {
                text-align: center;
                z-index: 5;
            }
            .title {
                font-size: 84px;
                text-shadow:1px 1px 10px #fff, 1px 1px 10px #ccc;
            }
            .subtitle {
                font-size: 30px;
                letter-spacing: 1px;
                text-shadow:1px 1px 10px #fff;
            }
            .m-b-md {
                margin-bottom: 30px;
            }
        </style>
    </head>
    <body>
        <div class="overlay"></div>
        <ul class="cb-slideshow">
            <li><span>Image 01</span><div></div></li>
            <li><span>Image 02</span><div><h3></h3></div></li>
            <li><span>Image 03</span><div><h3></h3></div></li>
            <li><span>Image 04</span><div><h3></h3></div></li>
            <li><span>Image 05</span><div><h3></h3></div></li>
            <li><span>Image 06</span><div><h3></h3></div></li>
        </ul>
        <div class="flex-center position-ref full-height">
            <div class="content">
                <div class="title m-b-md">
                    Arcade City
                </div>
                <div class="subtitle">
                    Introducing the <strong>realgame</strong><br />of peer-to-peer everything.
                </div>
            </div>
        </div>
        <script src="{{ mix('js/app.js') }}"></script>
    </body>
</html>
