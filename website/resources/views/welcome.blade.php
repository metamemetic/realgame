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
                background-color: rgba(0,0,0,0.3);
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

            .myButton {
            	background-color:#00d0c1;
            	-moz-border-radius:28px;
            	-webkit-border-radius:28px;
            	border-radius:28px;
            	border:1px solid #18ab29;
            	display:inline-block;
                font-family: 'Ubuntu Mono', monospace;
            	cursor:pointer;
            	color:#ffffff;
            	font-size:17px;
            	padding:16px 31px;
            	text-decoration:none;
            	text-shadow:0px 1px 0px #2f6627;
                outline: none;
            }
            .myButton:hover {
            	background-color:#5cbf2a;
            }
            .myButton:active {
            	position:relative;
            	top:1px;
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
                <a href="https://forum.arcade.city/t/pivoting-upward/37">
                    <button class="myButton" style="margin-top: 45px; ">
                        Read the Announcement
                    </button>
                </a>

            </div>
        </div>
        <script src="{{ mix('js/app.js') }}"></script>
        <!-- start Mixpanel analytics --><script type="text/javascript">(function(c,a){if(!a.__SV){var b=window;try{var d,m,j,k=b.location,f=k.hash;d=function(a,b){return(m=a.match(RegExp(b+"=([^&]*)")))?m[1]:null};f&&d(f,"state")&&(j=JSON.parse(decodeURIComponent(d(f,"state"))),"mpeditor"===j.action&&(b.sessionStorage.setItem("_mpcehash",f),history.replaceState(j.desiredHash||"",c.title,k.pathname+k.search)))}catch(n){}var l,h;window.mixpanel=a;a._i=[];a.init=function(b,d,g){function c(b,i){var a=i.split(".");2==a.length&&(b=b[a[0]],i=a[1]);b[i]=function(){b.push([i].concat(Array.prototype.slice.call(arguments,
0)))}}var e=a;"undefined"!==typeof g?e=a[g]=[]:g="mixpanel";e.people=e.people||[];e.toString=function(b){var a="mixpanel";"mixpanel"!==g&&(a+="."+g);b||(a+=" (stub)");return a};e.people.toString=function(){return e.toString(1)+".people (stub)"};l="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");
for(h=0;h<l.length;h++)c(e,l[h]);var f="set set_once union unset remove delete".split(" ");e.get_group=function(){function a(c){b[c]=function(){call2_args=arguments;call2=[c].concat(Array.prototype.slice.call(call2_args,0));e.push([d,call2])}}for(var b={},d=["get_group"].concat(Array.prototype.slice.call(arguments,0)),c=0;c<f.length;c++)a(f[c]);return b};a._i.push([b,d,g])};a.__SV=1.2;b=c.createElement("script");b.type="text/javascript";b.async=!0;b.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?
MIXPANEL_CUSTOM_LIB_URL:"file:"===c.location.protocol&&"//cdn4.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\/\//)?"https://cdn4.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn4.mxpnl.com/libs/mixpanel-2-latest.min.js";d=c.getElementsByTagName("script")[0];d.parentNode.insertBefore(b,d)}})(document,window.mixpanel||[]);
mixpanel.init("956d0964429ac047c37487fbd86c80fb");
mixpanel.track("AC-RG Homepage view");</script><!-- end Mixpanel -->
    </body>
</html>
