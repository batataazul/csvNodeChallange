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

    constructor(_data){
        this.getIndex = this.getIndex.bind(this);
        this.getHeader = this.getHeader.bind(this);
        this._createStudents = this._createStudents.bind(this);
        this._createPhone = this._createPhone.bind(this);
        this._createEmail = this._createEmail.bind(this);
        this.find = this.find.bind(this);
        this.concat = this.concat.bind(this);
        this._fixAndConcat = this._fixAndConcat.bind(this);
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
            student[Students.groups] = [];
            for (let j = 0; j < i.length; j++){
                if (this._header[j] === Students.invisible || this._header[j] === Students.see_all){
                    if (i[j] === 1 || i[j] === Students.yes){
                        student[this._header[j]] = true;
                    } else {
                        student[this._header[j]] = false;
                    }
                } else if(this._header[j] === Students.group){
                    let groupReg = new RegExp(" *[^A-Za-z0-9 ] *", "g");
                    let groupArr = ld.split(i[j], groupReg);
                    for (let w = 0; w < groupArr.length; w++){
                        let spaceBegReg = RegExp("^ ","g");
                        let spaceEndReg = RegExp(" $", "g");
                        groupArr[w] = groupArr[w].replace(spaceBegReg,"");
                        groupArr[w] = groupArr[w].replace(spaceEndReg, "");
                    }
                    student[Students.groups].push(groupArr);
                }
                else if (typeof this._header[j] === Students.string){
                    student[this._header[j]] = i[j];
                } else {
                    let address;
                    if (this._header[j][0] === Students.email){
                        let emailReg2 = new RegExp("[/ ,]", "g");
                        let addressList = ld.split(i[j],emailReg2);
                        addressList.forEach((element)=>{
                            address = this._createEmail(this._header[j],element);
                            if (address) {
                                student[Students.addresses].push(address);
                            }
                        })
                    } else{
                        address = this._createPhone(this._header[j], i[j]);
                        if (address){
                            student[Students.addresses].push(address);
                        }
                    }
                }
            }
            this._fixAndConcat(student);
        });
        this.studentList = ld.flatten(this.studentList);
        this.studentList = ld.without(this.studentList,undefined,null);
    }
    
    _fixAndConcat(student){
        student[Students.groups] = ld.flatten(student[Students.groups]);
        student[Students.groups] = ld.without(student[Students.groups], "", " ", undefined, null);
        let index = this.getIndex(student[Students.eid]);
        if (!this.studentList[index]) {
            this.studentList[index] = [student];
        } else if (this.studentList[index][0][Students.eid] === student[Students.eid]) {
            this.concat(student, index, 0);
        } else {
            let newIndex = this._find(index, student);
            if (newIndex >= 0) {
                this.concat(student, index, newIndex);
                console.log("oi " + String(student[Students.groups]));
            } else {
                this.studentList[index].push(student);
            }
        }
    }
    _createPhone(header,address){
        let type = header[0];
        let tags = ld.drop(header,1);
        let addressObj = {
            "type" : type,
            "tags" : tags
        }
        if (this.phoneUtil.isPossibleNumberString(address,"BR")) {
            addressObj[Students.address] = String(this.phoneUtil.parseAndKeepRawInput(address, "BR").getCountryCodeOrDefault()) + 
            String(this.phoneUtil.parseAndKeepRawInput(address,"BR").getNationalNumber());
        }else{
            return;
        }
        return addressObj;
    }

    _createEmail(header, address){
        let emailReg = new RegExp("[\\w\\-\\.]+@[\\w\\-]+\\.[\\w\\-]+(\\.[a-z]{2})?", "g");
        let type = header[0];
        let tags = ld.drop(header, 1);
        let addressObj = {
            "type": type,
            "tags": tags
        }
        if (emailReg.test(address)) {
            addressObj[Students.address] = address;
        } else {
            return;
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
        //console.log(this.studentList[index][newIndex]);
        //console.log(student);
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
