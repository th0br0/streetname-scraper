"use strict";

const JSONStream = require('JSONStream');
const es = require('event-stream');
const fs = require('fs');
const _ = require('lodash');

const streets = _.indexBy(require("./data/all"), 'title');

function getStream() {
    let jsonPath = process.argv[2],
        stream = fs.createReadStream(jsonPath, {encoding: 'utf8'}),
        parser = JSONStream.parse('features.*');
    return stream.pipe(parser);
}

let matched = [];

getStream()
.pipe(es.map((data, cb) => {
    if(!(data.properties.name in streets))
        return cb();

    data.properties = _.merge(data.properties, streets[data.properties.name]);
    cb(null, data);
}))
.pipe(es.writeArray((err, array) => {
    const geojson = {
        type: "FeatureCollection",
        crs: {
            type: "name",
            properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" }
        },
        features: array
    };


    const ws = fs.createWriteStream(process.argv[3]);
    const out = JSONStream.stringifyObject();
    out.pipe(ws);

    for(let key in geojson) out.write([key, geojson[key]]);
    out.end();
}));

