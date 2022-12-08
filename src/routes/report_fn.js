const queue = require("../models/queue");
const chamber_list = require("../models/chamber_list");
const operate_items = require("../models/operate-items");
const fs = require("fs");

module.exports = {
    upload: async function upload(file, saveDir, path) {
        return new Promise((resolve, reject) => {
            console.log(saveDir);
            if (!fs.existsSync(saveDir)) {
                fs.mkdirSync(saveDir);
            }
            file.mv(`${saveDir}/${file.name}`, (err) => {
                if (err) reject();
                resolve({
                    path: `${path}/${file.name}`,
                    name: file.name,
                    size: file.size,
                    date: new Date(),
                });
            });
        });
    },
    deleteFile: async function deleteFile(deleteDir) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(deleteDir)) {
                reject()
            } else {
                fs.unlink(deleteDir, (err) => {
                    if (err) reject()
                    resolve(true)
                })
            }

        });
    },


};