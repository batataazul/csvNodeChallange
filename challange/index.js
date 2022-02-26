import { parse } from "csv-parse/sync";
import fs from "fs";
import ld  from "lodash";
import glp from "google-libphonenumber";

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

class Student{
    constructor(){
        this.receiveData = this.receiveData.bind(this);
    }

    receiveData(_parser){

    }
}

(function (){
    let parser = new CsvParser("input.csv");
    console.log(ld.words(parser.getData()[0][2]));
    console.log(ld.split("sala 5, sala 6",/ *[^A-Za-z0-9 ] */g))
})();
