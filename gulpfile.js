const gulp = require('gulp');
const gulpSequence = require('gulp-sequence');

//-- Configuration -----------------------------------------------------------//
//----------------------------------------------------------------------------//

const SITE_URL = 'http://example.com';
const META_AUTHOR = 'Author'
const TWITTER_HANDLE = '@example'
const FACEBOOK_APP_ID = ''

const HTML_TITLE_FUNCTION = function(file) {
  var path = require('path');
  var pageName = path.basename(file.path).replace(/\.[^/.]+$/, '');
  if (pageName == 'index') {
    return 'Discontinuity Static Site Generator Demo';
  } else {
    return pageName.charAt(0).toUpperCase() + pageName.slice(1);
  }
}

const META_DESCRITION_FUNCTION = function(file) {
  return "Sample webiste for Discontinuity Static Site Generator"
}

const AWS_BUCKET_SETTINGS = {
  region: 'eu-west-1',
  params: {
    Bucket: 'BUCKET_NAME',
  },
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
}
const AWS_ASSETS_CACHE_TIME = 60 * 60 * 24;

const SUPPORTED_BROWSERS = ['> 1%'];

//----------------------------------------------------------------------------//

const INPUT = './input/';
const OUTPUT = './output/';
var BLOG_ARTICLES;

gulp.task('default', gulpSequence('html', 'css', 'js', 'assets', 'sitemap'));

//-- HTML --------------------------------------------------------------------//
//----------------------------------------------------------------------------//

gulp.task('html', gulpSequence('html-templates', 'html-markdown', 'html-blog-articles'));

var htmlmin = require('gulp-htmlmin');

gulp.task('html-files', () => {
  return gulp.src(['**/*.html', '!**/_*.*'], {
    cwd: INPUT
  })
    .pipe(changed())
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true,
      minifyJS: true,
    }))
    .pipe(gulp.dest(OUTPUT));
})

gulp.task('html-templates', () => {
  const data = require('gulp-data');
  const nunjucksRender = require('gulp-nunjucks-render');
  return gulp.src(['**/*.njk', '!**/_*.*'], {
    cwd: INPUT
  })
    .pipe(changed('.html'))
    .pipe(data(file => {
      return getTemplateData(file);
    }))
    .pipe(nunjucksRender({
      path: INPUT
    }))
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true,
      minifyJS: true,
    }))
    .pipe(gulp.dest(OUTPUT));
})

gulp.task('html-markdown', () => {
  var markdown = require('gulp-markdown');
  var wrap = require('gulp-wrap');
  var fs = require('fs');
  const data = require('gulp-data');

  return gulp.src(['**/*.md', '!blog/*.md', '!**/_*.*'], {
    cwd: INPUT
  })
    .pipe(changed('.html'))
    .pipe(markdown())
    .pipe(data(file => {
      return getTemplateData(file);
    }))
    .pipe(compileMardown({
      templatePath: 'templates/_markdown.njk'
    }))
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true,
      minifyJS: true,
    }))
    .pipe(gulp.dest(OUTPUT));
});

gulp.task('html-blog-articles', () => {
  const replace = require('gulp-replace');
  const rename = require('gulp-rename');

  var markdown = require('gulp-markdown');
  var wrap = require('gulp-wrap');
  var fs = require('fs');
  const data = require('gulp-data');

  return gulp.src(['blog/*.md', '!**/_*.*'], {
    cwd: INPUT
  })
    .pipe(rename(function(path) {
      path.basename = path.basename.replace(/^[0-9]+-/, '')
    }))
    .pipe(changed('.html'))
    .pipe(data(file => {
      var path = require('path');
      var title = extractTitleFromMarkdown(file.contents, file.path)
      return {
        HTML_TITLE: `${title}`,
        title: title,
        pathName: encodeURI(path.basename(file.path).replace(/.md$/, '')),
        teaser: extractPreviewText(file.contents, file.path),
        BODY_CLASS: '',
        BASE_URL: '../'
      }
    }))
    .pipe(replace(/\s*#\s+.*\n/, ''))
    .pipe(markdown())
    .pipe(compileMardown({
      templatePath: 'templates/_blog-article.njk'
    }))
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true,
      minifyJS: true,
    }))
    .pipe(gulp.dest(OUTPUT + 'blog/'));
});

//-- CSS ---------------------------------------------------------------------//
//----------------------------------------------------------------------------//

gulp.task('css', gulpSequence('css-bundle'));

const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');
const doiuse = require('doiuse')
const cssProcessors = [
  require('postcss-cssnext')({
    browsers: SUPPORTED_BROWSERS
  }),
  require('csswring')(),
  require('postcss-reporter')(),
];

gulp.task('css-bundle', function() {
  const concat = require('gulp-concat-css');
  return gulp.src(['**/*.css'], {
    cwd: INPUT
  })
    .pipe(sourcemaps.init())
    .pipe(concat('css/bundle.css'))
    .pipe(postcss(cssProcessors))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(OUTPUT));
});

//-- JS ----------------------------------------------------------------------//
//----------------------------------------------------------------------------//

gulp.task('js', function() {
  var uglify = require('gulp-uglify');

  return gulp.src(['**/*.js'], {
    cwd: INPUT
  })
    .pipe(changed())
    .pipe(uglify({
      preserveComments: 'license'
    }))
    .pipe(gulp.dest(OUTPUT));
});

//-- Assets ------------------------------------------------------------------//
//----------------------------------------------------------------------------//

gulp.task('assets', function() {
  const imagemin = require('gulp-imagemin');

  return gulp.src(['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.mp4', '**/*.otf', '**/*.woff', '**/*.ttf'], {
    cwd: INPUT
  })
    .pipe(changed())
    .pipe(imagemin())
    .pipe(gulp.dest(OUTPUT));
});

//-- Sitemap -----------------------------------------------------------------//
//----------------------------------------------------------------------------//

gulp.task('sitemap', function() {
  var sitemap = require('gulp-sitemap');

  gulp.src('**/*.html', {
    cwd: OUTPUT
  })
    .pipe(sitemap({
      siteUrl: SITE_URL
    }))
    .pipe(gulp.dest(OUTPUT));
});

//-- Lint --------------------------------------------------------------------//
//----------------------------------------------------------------------------//

gulp.task('lint', gulpSequence('lint-html', 'lint-css'));

gulp.task('lint-css', function() {
  var processors = [
    doiuse({
      browsers: SUPPORTED_BROWSERS,
      onFeatureUsage: function(usageInfo) {
        console.log(usageInfo.message)
      }
    }),
  ];
  return gulp.src(['css/*.css', '!**/normalize.css'], {
    cwd: OUTPUT
  })
    .pipe(postcss(processors))
})

gulp.task('lint-html', function() {
  var w3cjs = require('gulp-w3cjs');
  gulp.src('**/*.html', {
    cwd: OUTPUT
  })
    .pipe(w3cjs())
    .pipe(w3cjs.reporter());
});

//-- Publish -----------------------------------------------------------------//
//----------------------------------------------------------------------------//

gulp.task('publish', function() {
  const awspublish = require('gulp-awspublish');
  const awspublishRouter = require('gulp-awspublish-router');
  const gulpUtil = require('gulp-util');
  const publisher = awspublish.create(AWS_BUCKET_SETTINGS);

  gulp.src(['**/*.*', '!**/.DS_Store'], {
    cwd: OUTPUT
  })
    .pipe(awspublishRouter({
      cache: {
        cacheTime: 0
      },

      routes: {
        '^.+\\.(?:js|css|svg|png|jpg|jpeg|ttf|otf)$': {
          cacheTime: AWS_ASSETS_CACHE_TIME
        },

        '^.+$': '$&'
      }
    }))
    .pipe(publisher.publish())
    .pipe(publisher.sync())
    .pipe(awspublish.reporter())
});

//-- Custom pipes ------------------------------------------------------------//
//----------------------------------------------------------------------------//

function changed(extension) {
  const changed = require('gulp-changed');
  var options = {}
  if (extension) {
    options.extension = extension
  }
  return changed(OUTPUT, options);
}

function compileMardown(options) {
  const through = require('through2')
  const gutil = require('gulp-util');
  const nunjucks = require('nunjucks');

  var compile = new nunjucks.Environment(new nunjucks.FileSystemLoader(INPUT));

  return through.obj(function(file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) {
      this.emit('error', new gutil.PluginError('compileMardown', 'Streaming not supported'));
      return cb();
    }

    var data = file.data;
    data.contents = file.contents;
    var _this = this;

    try {
      compile.render(options.templatePath, data, function(err, result) {
        if (err) {
          _this.emit('error', new gutil.PluginError('compileMardown', err, {
            fileName: file.path
          }));
          return cb();
        }
        file.contents = new Buffer(result);
        _this.push(file);
        cb();
      });
    } catch (err) {
      _this.emit('error', new gutil.PluginError('compileMardown', err, {
        fileName: file.path
      }));
      cb();
    }
  });
}

// - Helpers -----------------------------------------------------------------//
//----------------------------------------------------------------------------//

function extractTitleFromMarkdown(text, context) {
  var titlePattern = /\s*#\s+(.*)\s*\n/;
  var match = titlePattern.exec(text);
  if (!match) {
    process.stderr.write(`[ERROR] No title for '${context}'`);
    process.exit(1);
  }
  return match[1];
}

function extractPreviewText(text, context) {
  var marked = require('marked');
  var html = marked(text.toString());
  var firstParagraphPattern = /<p>([\s\S]+?)<\/p>/;
  var match = firstParagraphPattern.exec(html);
  if (!match) {
    process.stderr.write(`[ERROR] No paragagraph for '${context}'`);
    process.exit(1);
  }

  var previewText = match[1];
  previewText = previewText.replace(/(<([^>]+)>)/ig, '')

  var aproxNumberOfChars = 160;
  var spaceIndex = previewText.indexOf(' ', aproxNumberOfChars)

  if (spaceIndex != -1) {
    previewText = previewText.substring(0, spaceIndex);
  } else {
    previewText = previewText
  }

  previewText = previewText
    .replace(/\n/g, ' ')
    .replace(/\W+$/, '')
  return previewText;
}

function getTemplateData(file) {
  var result = {
    SITE_URL: SITE_URL,
    HTML_TITLE: HTML_TITLE_FUNCTION(file),
    META_DESCRITION: META_DESCRITION_FUNCTION(file),
    META_AUTHOR: META_AUTHOR,
    TWITTER_HANDLE: TWITTER_HANDLE,
    FACEBOOK_APP_ID: FACEBOOK_APP_ID,

    BASE_URL: getBaseURL(file),
    ARTICLES: getBlogArticles(),
  }
  return result;
}

function getBaseURL(file) {
  var path = require('path');
  var relative = path.relative(path.dirname(file.path), INPUT)
  if (relative) {
    return './' + relative;
  }
  return ".";
}

function getBlogArticles() {
  if (BLOG_ARTICLES == null) {
    var fs = require('fs');
    var blogPostsDir = INPUT + '/blog'
    postSources = fs.readdirSync(blogPostsDir)
      .filter(item => /^\d/.test(item))
      .sort(function(a, b) {
        var aValue = parseInt(/(\d+).+/.exec(a)[1]);
        var bValue = parseInt(/(\d+).+/.exec(b)[1]);
        return aValue - bValue;
      });
    var BLOG_ARTICLES = [];
    for (postPath of postSources) {
      var filePath = blogPostsDir + '/' + postPath;
      var text = fs.readFileSync(filePath, 'utf-8');
      var title = extractTitleFromMarkdown(text, filePath)
      var teaser = extractPreviewText(text, filePath)
      var pathName = postPath.replace(/^[0-9]+-/, '').replace(/\.md$/, '')
      BLOG_ARTICLES.push({
        TITLE: title,
        PATH_NAME: pathName,
        TEASER: teaser
      })
    }
  }
  return BLOG_ARTICLES;
}
