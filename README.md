
From the [docs](https://github.com/ArcadeCity/docs):

* [What is Arcade City?](https://github.com/ArcadeCity/docs/wiki/What-is-Arcade-City%3F) - Realgame explained
* [Tech stack](https://github.com/ArcadeCity/docs/wiki/Tech-stack)

### Structure

```
game - The realgame 3D web app, for now at https://play.arcade.city
website - The realgame website, soon at https://arcade.city
```

### Installation (game)

First install [Laravel](https://laravel.com/docs/5.8/valet) and optionally the development server [Valet](https://laravel.com/docs/5.8/valet).

```
git clone git@github.com:ArcadeCity/realgame.git
cd realgame/game
composer install
npm install
cp .env.example .env
php artisan key:generate
valet link realgame
valet secure realgame
```

App will be served at https://realgame.test
