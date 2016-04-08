.PHONY: clean watch open publish lint

output: input gulpfile.js
	./gulp

clean:
	rm -rf output

watch:
	./gulp
	echo "Watching changes in input"
	./node_modules/onchange/cli.js input gulpfile.js -- ./gulp

lint:
	./gulp lint

open:
	open ./output/index.html

publish:
	./gulp publish
