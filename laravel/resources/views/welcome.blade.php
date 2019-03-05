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

            .flex-center {
                align-items: center;
                display: flex;
                justify-content: center;
            }

            .button-container {
                position: fixed;
                bottom: 30px;
                left: 0;
                right: 0;
                text-align: center;
            }

            .loginbutton {
                width: 150px;
                height: 50px;
                margin: 0 15px;
                border-radius: 15px;
                background-color: #190529;
                font-family: monospace;
                color: white;
                font-size: 18px;
            }

            .loginbutton:hover {
                opacity: 0.8;
            }

            .loginbutton:active,
            .loginbutton:focus {
                outline: none;
            }
        </style>
    </head>
    <body>
        <div id="app" class="full-height">
            @if (!Auth::check())
                <div class="button-container">
                    <a href="/login">
                        <button class="loginbutton">Login</button>
                    </a>
                    <a href="/register">
                        <button class="loginbutton">Register</button>
                    </a>
                </div>
            @endif
            <babylon-canvas></babylon-canvas>
        </div>
        <script>window.auth_user = {!! json_encode($auth_user); !!};</script>
        <script src="{{ mix('js/app.js') }}"></script>
        <script src="//code.jquery.com/pep/0.4.0/pep.min.js"></script>
    </body>
</html>
