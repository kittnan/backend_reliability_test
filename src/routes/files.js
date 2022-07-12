let express = require("express");
let router = express.Router();
const fs = require("fs/promises");
var fileUpload = require("express-fileupload");
router.use(fileUpload());

const directoryPath = "C:/xampp/htdocs/uploads";
const address = "http://127.0.0.1:80/uploads";

router.post("/upload", (req, res, next) => {
    let files = req.files.File;
    if (files.length > 0) {
        const temp = files.map((file) => {
            const typeFile = file.name.split(".")[1];
            const newName = file.name.split(".")[0];
            const dateTime = new Date().getTime();
            const saveDirectory = `${directoryPath}/${newName}${dateTime}.${typeFile}`;
            const pathDirectory = `${address}/${newName}${dateTime}.${typeFile}`;
            file.mv(saveDirectory);
            return {
                name: file.name,
                size: file.size,
                path: pathDirectory,
            };
        });
        res.json(temp);
    } else {
        const typeFile = files.name.split(".")[1];
        const newName = files.name.split(".")[0];
        const dateTime = new Date().getTime();
        const saveDirectory = `${directoryPath}/${newName}${dateTime}.${typeFile}`;
        const pathDirectory = `${address}/${newName}${dateTime}.${typeFile}`;
        files.mv(saveDirectory);
        res.json({
            name: files.name,
            size: files.size,
            path: pathDirectory,
        });
    }
});

module.exports = router;