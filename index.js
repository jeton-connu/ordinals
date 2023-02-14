const ejs = require('ejs');
const fs = require('fs')
const path = require('path')
const swc = require("@swc/core");
const { minify } = require('html-minifier');
const grabOrdinalMetadata = require('./grabOrdinalMetadata')
const chalk = require('chalk')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const template = fs.readFileSync(path.join(__dirname, 'template', 'index.ejs'), 'utf-8')

function render(template, sketch, webgl, metadata) {
    return ejs.render(template, { sketch, webgl, metadata });
}

const sketch = fs.readFileSync(path.join(__dirname, 'src', 'sketch.js'), 'utf-8').replace('true /* gui */', "false");
const webgl = fs.readFileSync(path.join(__dirname, 'src', 'webgl.js'), 'utf-8');


const sat = process.argv[2]


function constructJSONLD(metadata) {


    const name = metadata.name;
    delete metadata.name

    return {
        "@context": "http://schema.org/",
        "@type": "VirtualLocation",
        "name": `Ordinal #${sat}`,
        "datePublished": dayjs.utc(new Date(metadata.dateMined)).format("YYYY-MM-DD"),
        satNumber: parseFloat(sat.toString()),
        satName: name,
        ...metadata
    }

}

; (async () => {

    const { code: minifiedSketch } = await swc.transform(sketch, {
        minify: true,
        jsc: {
            "minify": {
                "compress": true, // equivalent to {}
                "mangle": true
            }
        },
    })


    const { code: minifiedWebgl } = await swc.transform(webgl, {
        minify: true,
        jsc: {
            "minify": {
                "compress": true, // equivalent to {}
                "mangle": true
            }
        },
    })

    const metadata = await grabOrdinalMetadata(sat);

    console.log(`Inscribing sat #${sat} with metadata :\n`);

    console.log(JSON.stringify(constructJSONLD(metadata), null, 2));

    const result = minify(render(template, minifiedSketch, minifiedWebgl, JSON.stringify(constructJSONLD(metadata))), {
        removeAttributeQuotes: true,
        collapseWhitespace: true,
        removeComments: true,
        removeOptionalTags: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeTagWhitespace: true,
        useShortDoctype: true,
    });

    const outputPath = path.join(__dirname, 'dist', `${sat}.html`);

    fs.writeFileSync(outputPath, result)


    console.log(`\n${outputPath} [${chalk.green((Buffer.from(result, 'utf-8').length / 1024).toFixed(2))} kb] `);
})()