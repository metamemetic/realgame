
From the [docs](https://github.com/ArcadeCity/docs):

* [What is Arcade City?](https://github.com/ArcadeCity/docs/wiki/What-is-Arcade-City%3F) - Realgame explained
* [Tech stack](https://github.com/ArcadeCity/docs/wiki/Tech-stack)

### Installation

First install [Laravel](https://laravel.com/docs/5.8/valet) and optionally the development server [Valet](https://laravel.com/docs/5.8/valet).

```
git clone git@github.com:ArcadeCity/realgame.git
cd realgame/laravel
composer install
npm install
cp .env.example .env
php artisan key:generate
valet link realgame
valet secure realgame
```

App will be served at https://realgame.test
