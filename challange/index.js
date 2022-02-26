import { parse } from "csv-parse/sync";
import fs from "fs";
import pkg  from "lodash";
const { ld } = pkg;
import pkg2 from "google-libphonenumber";
const { glp } = pkg2;

class CsvParser{
    constructor(path) {
        this.getData = this.getData.bind(this);
        let data;
        (async function () {
            const text = fs.readFileSync(path,"utf-8");
            data = parse(text, { cast: true });
        })();
        this._data = data;
    }

    getData() {
        return this._data;
    }
}

(function (){
    let parser = new CsvParser("input.csv");
    console.log(parser.getData()[0]);
})()
