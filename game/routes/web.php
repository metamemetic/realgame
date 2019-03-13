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
    return view('voxel', [
        'auth_user' => Auth::user()
    ]);
});

Route::get('/old', function () {
    return view('welcome', [
        'auth_user' => Auth::user()
    ]);
});


Auth::routes();

Route::get('/home', 'HomeController@index')->name('home');
Route::get('/opennode', 'OpenNodeController@demo_charge');
Route::get('/opennode/info', 'OpenNodeController@charge_info');
