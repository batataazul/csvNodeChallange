import { parse } from "csv-parse/sync";
import fs from "fs";
import ld from "lodash";
import glp from "google-libphonenumber";

class CsvParser{
    constructor(path) {
        this.getData = this.getData.bind(this);
        let data;
        (async function () {
            try { 
                const text = fs.readFileSync(path, "utf-8");
                data = parse(text, { cast: true });
            } catch (err){
                console.log(err);
            }
        })();
        this._data = data;
    }

    getData() {
        return this._data;
    }
}


class Students{
    static invisible = "invisible";
    static see_all = "see_all";
    static yes = "yes";
    static eid = "eid";
    static address = "address";
    static phone = "phone";
    static email = "email";
    static group = "group";
    static addresses = "addresses";
    static groups = "groups";
    static array = "array";
    static string = "string";
    static emailReg = /^[\w\-\.]+@[\w\-]+\.[\w\-]+(\.[a-z]{2})?$/g;
    static groupReg = / *[^A-Za-z0-9 ] */g;

    constructor(_data){
        this.getIndex = this.getIndex.bind(this);
        this.getHeader = this.getHeader.bind(this);
        this._createStudents = this._createStudents.bind(this);
        this._createAddress = this._createAddress.bind(this);
        this.find = this.find.bind(this);
        this.concat = this.concat.bind(this);
        this.phoneUtil = glp.PhoneNumberUtil.getInstance();

        this._data = _data;
        this._header = this.getHeader();
        console
        this._size = this._data.length
        this.studentList = new Array(this._size);
        this._createStudents();
    }

    getIndex(id){
        return id % this._size;
    }

    getHeader(){
        let header = this._data[0];
        this._data = ld.drop(this._data,1);
        for (let i = 0; i < header.length; i++){
            let aux = ld.split(header[i]," ");
            if (aux.length > 1){
                header[i] = aux;
            }
        }
        return header;
    }

    _createStudents(){
        this._data.forEach(i => {
            let student = {};
            student[Students.addresses] = [];
            for (let j = 0; j < i.length; j++){
                switch (this._header[j]) {
                    case Students.invisible:
                        if (i[j]){
                            student[this._header[j]] = true;
                        } else {
                            student[this._header[j]] = false;
                        }
                        break;
                    case Students.see_all:
                        if(i[j] === Students.yes){
                            student[this._header[j]] = true;
                        } else {
                            student[this._header[j]] = false;
                        }
                        break;
                    case Students.group:
                        student[Students.groups] = ld.split(i[j],Students.groupReg);
                        break;
                    default:
                        if (typeof this._header[j] === Students.string){
                            student[this._header[j]] = i[j];
                        } else {
                            let address = this._createAddress(this._header[j], i[j]);
                            if (address){
                                student[Students.addresses].push(address);
                            }
                        }
                        break;
                }
            }
            let index = this.getIndex(student[Students.eid]);
            if (!this.studentList[index]){
                this.studentList[index] = [student];
            } else if (this.studentList[index][0][Students.eid] === student[Students.eid]){
                this.concat(student,index,0);
            } else {
                let newIndex = this._find(index,student);
                if (newIndex >= 0){
                    this.concat(student, index,newIndex);
                } else {
                    this.studentList[index].push(student);
                }
            }
        });
        this.studentList = ld.flatten(this.studentList);
        this.studentList = ld.without(this.studentList,undefined,null);
    }

    _createAddress(header,address){
        let type = header[0];
        let tags = ld.drop(header,1);
        let addressObj = {
            "type" : type,
            "tags" : tags
        }
        switch (type) {
            case Students.phone:
                if (this.phoneUtil.isPossibleNumberString(address)) {
                    addressObj[Students.address] = this.phoneUtil.parse(address, "BR");
                }else{
                    return;
                }
                break;
        
            case Students.email:
                if (Students.emailReg.test(address)){
                    addressObj[Students.address] = address;
                } else{
                    return;
                }
                break;
        }
        return addressObj;
    }

    find(index,student){
        let newIndex = -1;
        if (typeof this.studentList[index] === Students.array){
            for (let i = 0; i < this.studentList[index].length; i++){
                if (this.studentList[index][i][Students.eid] === student[Students.eid]){
                    newIndex = i;
                }
            }
        }
        return newIndex;
    }

    concat(student,index,newIndex){
        this.studentList[index][newIndex][Students.addresses] = ld.uniqBy(ld.concat(
            this.studentList[index][newIndex][Students.addresses], student[Students.addresses]));
        this.studentList[index][newIndex][Students.groups] = ld.uniqBy(ld.concat(
            this.studentList[index][newIndex][Students.groups], student[Students.groups]));
    }
}

(function (){
    let parser = new CsvParser("input.csv");
    let studentList = new Students(parser.getData());
    try {
        fs.writeFileSync("output.json", JSON.stringify(studentList.studentList, null, 4));
    } catch (err){
        console.log(err);
    }
})();
