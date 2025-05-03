// Імпорт необхідних функцій і плагінів з Gulp та інших бібліотек
const { src, dest, watch, task, series, parallel } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const browserSync = require("browser-sync").create();
const cssnano = require("cssnano");
const rename = require("gulp-rename");
const postcss = require("gulp-postcss");
const csscomb = require("gulp-csscomb");
const autoprefixer = require("autoprefixer");
const mqpacker = require("css-mqpacker");
const sortCSSmq = require("sort-css-media-queries");

// Об'єкт із шляхами до файлів проєкту для легкого доступу та управління
const PATH = {
  scssRootFile: "./assets/scss/style.scss", // Основний SCSS файл
  scssAllFiles: "./assets/scss/**/*.scss", // Всі SCSS файли для спостереження
  scssFolder: "./assets/scss/", // Папка з SCSS файлами
  cssFolder: "./assets/css/", // Папка для скомпільованих CSS файлів
  htmlFolder: "./", // Папка для HTML файлів
  htmlAllFiles: "./*.html", // Всі HTML файли для спостереження
  jsFolder: "./assets/js/", // Папка з JS файлами
  jsAllFiles: "./assets/js/**/*.js", // Всі JS файли для спостереження
};

// Масив плагінів PostCSS для використання у задачах
const PLUGINS = [
  autoprefixer({
    // Автоматично додає вендорні префікси до CSS
    overrideBrowserslist: ["last 5 versions"],
    cascade: true,
  }),
  mqpacker({ sort: sortCSSmq }), // Групує та сортує медіа-запити
];

// Функція для компіляції SCSS у CSS
function compileScss() {
  return src(PATH.scssRootFile) // Вихідний файл
    .pipe(sass().on("error", sass.logError)) // Компіляція SASS у CSS із обробкою помилок
    .pipe(postcss(PLUGINS)) // Застосування плагінів PostCSS
    .pipe(csscomb()) // Форматування CSS коду
    .pipe(dest(PATH.cssFolder)) // Зберігання результату у вказану папку
    .pipe(browserSync.stream()); // Оновлення потоку BrowserSync для гарячого перезавантаження
}

// Функція для розробницької компіляції SCSS у CSS із source maps
function compileScssDev() {
  const pluginsForDevMode = [...PLUGINS]; // Копіювання масиву плагінів

  pluginsForDevMode.splice(0, 1); // Видалення autoprefixer з масиву плагінів для розробки

  return src(PATH.scssRootFile, { sourcemaps: true }) // Включення source maps
    .pipe(sass().on("error", sass.logError)) // Компіляція SASS у CSS із обробкою помилок
    .pipe(postcss(pluginsForDevMode)) // Застосування плагінів PostCSS без autoprefixer
    .pipe(dest(PATH.cssFolder, { sourcemaps: true })) // Зберігання результату з source maps
    .pipe(browserSync.stream()); // Оновлення потоку BrowserSync
}

// Функція для компіляції та мініфікації SCSS у CSS
function compileScssMin() {
  const pluginsForMinify = [...PLUGINS, cssnano({ preset: "default" })]; // Додавання cssnano для мініфікації

  return src(PATH.scssRootFile)
    .pipe(sass().on("error", sass.logError)) // Компіляція SASS у CSS із обробкою помилок
    .pipe(postcss(pluginsForMinify)) // Застосування плагінів PostCSS включно із мініфікацією
    .pipe(rename({ suffix: ".min" })) // Додавання суфіксу .min до імені файлу
    .pipe(dest(PATH.cssFolder)); // Зберігання мініфікованого файлу
}

// Функція для форматування SCSS файлів за допомогою csscomb
function comb() {
  return src(PATH.scssAllFiles) // Всі SCSS файли для обробки
    .pipe(csscomb()) // Застосування csscomb для форматування
    .pipe(dest(PATH.scssFolder)); // Зберігання відформатованих файлів
}

// Функція для ініціалізації BrowserSync
function syncInit() {
  browserSync.init({
    // Налаштування сервера
    server: {
      baseDir: "./", // Базова директорія для сервера
    },
  });
}

// Асинхронна функція для оновлення BrowserSync
async function sync() {
  browserSync.reload();
}

// Функція для спостереження за змінами у файлах
function watchFiles() {
  syncInit(); // Ініціалізація BrowserSync
  watch(PATH.scssAllFiles, series(compileScss, compileScssMin)); // Спостереження за SCSS файлами
  watch(PATH.htmlAllFiles, sync); // Спостереження за HTML файлами
  watch(PATH.jsAllFiles, sync); // Спостереження за JS файлами
}

// Реєстрація задач Gulp
task("dev", compileScssDev);
task("min", compileScssMin);
task("scss", series(compileScss, compileScssMin));
task("comb", comb);
task("watch", watchFiles);
