# Discontinuity Static Site Generator

A an highly opinionated static site generator designed for
small sites.

This build system transforms the files present in the `input` directory in a static website in the `output` directory. The transformation focus primarily on:

- dynamic generation of `.html` files using a template and from markdown files.
- optimisation of the files for performance.

This repo includes a demo site in `input` which showcases all the features. For another example of a website generated with this repo see: [discontinuity.eu](http://discontinuity.eu)

## Features

- Transformations:
  - `.html` and all the files which are converted to `.html` are minfied
  - `.njk` files are converted to `.html` files using the [nunjucks](https://mozilla.github.io/nunjucks/) template engine. The templates are wrapped with the layout file: `templates/_layout.njk`
  - `.md` are converted to HTML and are processed with the `templates/_markdown.njk` template. The files in the `blog` are treated specially as they rappresenta articles and are processed with the `templates/_blog-article.njk` template
  - `.css` files are processed with [cssnext](http://cssnext.io), concatenated and minified in the file `css/bundle.css`
  - `.js` files are uglified preserving license comments
  - Images files are optimised
  - `_*.*` (files starting with an underscore) are not converted to html. The underscore can be used for draft files.
- SEO optimisations:
  - Custom meta tags for every page
  - Social Meta tags support in blog articles
  - Automatic generation of sitemap
- Other features:
  - certain tasks compile only changed files to speed up the build
  - sourcemaps are supported
  - lint task to check compatibility with supported browsers
  - Publication to [Amazon S3](https://aws.amazon.com/s3/)
  - MIT license

## Getting started

###### To create a project

```shell
# replace MY_SITE with the name of your project
$ git clone https://github.com/Discontinuity-srl/discontinuity-static-site-generator
$ mv discontinuity-static-site-generator MY_SITE
$ cd MY_SITE
$ git branch -m origin upstream

# view the demo site
$ make open

# edit the configuration of at the top of gulpfile.js file
```

###### To work on the site

```shell
$ make watch
$ atom .

# edit the files in the input dir
```

###### To publish the site to S3

- Create an [Amazon S3 bucket](http://docs.aws.amazon.com/AmazonS3/latest/dev/create-bucket-get-location-example.html) and [configure it for static hosting](http://docs.aws.amazon.com/AmazonS3/latest/dev/HowDoIWebsiteConfiguration.html).
- Update the bucket name and the
  region at in the [`gulpfile.js`](https://github.com/fabiopelosin/discontinuity-static-site-generator/blob/master/gulpfile.js#L26-L27)
- Store your credentials in the `~/.aws/credentials` file. For more info see [Configuring the AWS Command Line Interface](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html)

```shell
$ make clean
$ make output
$ make lint
$ make publish
```

###### Launch a single gulp tasks

```shell
$ ./gulp html
```

###### Updating your project with the changes in this repo

```shell
$ git fetch upstream
$ git merge upstream/master
```


## Rationale

- Static site generators tools like [Jekyll](https://jekyllrb.com) and the  [Middleman](https://middlemanapp.com) are great, however customisations which are not foreseen might be complicated as they require to work around the framework. This build system instead is intended to be used as a blue print and can be completely tuned to your needs editing the `gulpfile.js`.
- Any project should be self contained and should work out of the box independently from the software installed in your machinge. In this repo there is no need to install global tools. Moreover all the npm packages are included in the repo to minimise the time spent in setup.
- Make is awesome even if just used for launching gulp taks.

## Caveats

- Files are not removed from the `output` dir it is necessary to delete
them manually after renaming a file in the `input` dir. Alternatively it is possible to just rebuild everything from scratch: `$ make clean && make output`
- According to your system environment, it might be necessary to reinstall some npm packages. To reinstall everything run `$ rm -rf node_modules && npm install`

## Tips


In order to reduce the costs and get the best performance setup [Amazon CloudFront](https://aws.amazon.com/cloudfront/) to serve the website. Remeber to configure error pages for at least the `403` and the `404` HTTP Error Codes.

We recomend using Atom as an editor with the following plugins:

  - atom-beautify
  - css-comb
  - esformatter
  - language-babel
  - language-nunjucks
  - linter
  - linter-csslint
  - linter-eslint
  - linter-htmlhint
  - pigments
  - turbo-javascript

## Dependencies

- Node.js
- Make

Tested with:

- GNU Make 3.81
- Node.js 5.9.0
- OS X 10.11.4
