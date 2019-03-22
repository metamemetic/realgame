<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>Arcade City</title>

        <style>
            html, body {
                background-color: #000;
                color: #636b6f;
                font-family: monospace;
                font-weight: 200;
                height: 100vh;
                margin: 0;
            }

            .full-height {
                height: 100vh;
            }
        </style>
    </head>
    <body>
        <div id="app" class="full-height">
            <inventory-bar></inventory-bar>
            <babylon-canvas></babylon-canvas>
            <token-widget></token-widget>
        </div>
        <script>window.auth_user = {!! json_encode($auth_user); !!};</script>
        <script src="{{ mix('js/app.js') }}"></script>
    </body>
</html>
