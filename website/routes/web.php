<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

/** App redirects */
Route::get('/android', function () {
    return redirect('https://play.google.com/store/apps/details?id=arcade.city.mobile');
});

Route::get('/ios', function () {
    return redirect('https://itunes.apple.com/us/app/arcade-city/id1082799882');
});
