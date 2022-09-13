let express = require("express");
let router = express.Router();
const fs = require("fs/promises");
var fileUpload = require("express-fileupload");
router.use(fileUpload());


router.post("/upload", (req, res, next) => {
    let files = req.files.Files;
    if (files.length > 0) {
        const temp = files.map((file) => {
            const typeFile = file.name.split(".")[1];
            const newName = file.name.split(".")[0];
            const dateTime = new Date().getTime();
            const saveDirectory = `${process.env.PATH_IMAGE}/${newName}${dateTime}.${typeFile}`;
            const pathDirectory = `${process.env.URL_DOWNLOAD}/${newName}${dateTime}.${typeFile}`;
            file.mv(saveDirectory);
            return {
                name: file.name,
                size: file.size,
                path: pathDirectory,
            };
        });
        res.json(temp);
    } else {
        res.json({
            msg: 'no files'
        })
    }
});

module.exports = router;