import { parse } from "csv-parse";
import { createReadStream } from "fs";

let parser = parse({ cast: true }, function (err, records) {
    console.log(records);
});

createReadStream("input.csv").pipe(parser);
