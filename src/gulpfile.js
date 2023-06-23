var browserSync = require('browser-sync').create();
var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var htmlReplace = require("gulp-html-replace");

var browserify = require("browserify");
var tsify = require("tsify");
var uglify = require("gulp-uglify");

var sass = require("gulp-sass")(require("sass"));
var cleanCss = require("gulp-clean-css");
var autoprefixer = require("gulp-autoprefixer");
var rename = require("gulp-rename");
var source = require("vinyl-source-stream");

var paths = {
	typescript: {
		src: "ts/**/*.ts"
	},
	scss: {
		base: "scss/",
		src: "scss/**/*.scss"
	},
	css: {
		minifySrc: ["css/**/*.css", "!css/**/*.min.css"],
		src: "css/**/*.css",
		dest: "css/"
	},
	js: {
		minifySrc: ["js/**/*.js", "!js/**/*.min.js"],
		dest: "js/"
	},
	publish: {
		dest: "publish/",
		sourceIndexHtml: "index.html"
	}
}

function browserifyScripts() {
	return browserify({
		basedir: ".",
		debug: true,
		entries: ["ts/main.ts"],
		cache: {},
		packageCache: {},
	  })
		.plugin(tsify)
		.bundle()
		.on('error', function(err){
			console.log(err.message);
		})
		.pipe(source("bundle.js"))
		.pipe(gulp.dest(paths.js.dest));
}

function buildScss() {
	return gulp.src(paths.scss.src, { base: paths.scss.base })
		.pipe(sourcemaps.init())
		.pipe(sass())
		.pipe(autoprefixer())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(paths.css.dest));
}

function minifyStyles() {
	return gulp.src(paths.css.minifySrc)
		.pipe(cleanCss())
		.pipe(rename({ extname: ".min.css" }))
		.pipe(gulp.dest(paths.publish.dest));
}

function minifyScripts() {
	return gulp.src(paths.js.minifySrc)
		.pipe(uglify())
        .pipe(rename({ extname: ".min.js" }))
		.pipe(gulp.dest(paths.publish.dest));
}

function publishHtml() {
	return gulp.src(paths.publish.sourceIndexHtml)
		.pipe(htmlReplace({
			"css": "styles.min.css",
			"js": "bundle.min.js"
		}))
		.pipe(gulp.dest(paths.publish.dest));
}

function watch() {
	gulp.watch(paths.typescript.src, browserifyScripts);
	gulp.watch(paths.scss.src, buildScss);
}

function serve() {
	browserSync.init({
		server: "./"
	});

	gulp.watch(paths.typescript.src, gulp.series(browserifyScripts, (cb) => { browserSync.reload(); cb(); }))
	gulp.watch(paths.scss.src, gulp.series(buildScss, (cb) => { browserSync.reload(); cb(); }))
	gulp.watch(["./**/*.html"]).on("change", browserSync.reload);
}

exports.scripts = browserifyScripts;
exports.styles = buildScss;
exports.watch = watch;
exports.serve = serve;

exports.default = gulp.parallel(browserifyScripts, buildScss);
exports.publish = gulp.parallel(
	gulp.series(browserifyScripts, minifyScripts),
	gulp.series(buildScss, minifyStyles),
	publishHtml
);