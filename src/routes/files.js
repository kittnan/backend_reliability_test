let express = require("express");
let router = express.Router();
const fs = require("fs/promises");
var fileUpload = require("express-fileupload");
router.use(fileUpload());

router.post("/upload", (req, res, next) => {
    if (req.files && req.files.Files.length > 0) {
        let files = req.files.Files;
        const temp = files.map((file) => {
            const typeFile = file.name.split(".")[1];
            const newName = file.name.split(".")[0] + new Date().getTime().toString();
            const dateTime = new Date().getTime();
            const saveDirectory = `${process.env.PATH_IMAGE}/${newName}.${typeFile}`;
            const pathDirectory = `${process.env.URL_DOWNLOAD}/${newName}.${typeFile}`;
            file.mv(saveDirectory);
            return {
                name: `${newName}.${typeFile}`,
                size: file.size,
                path: pathDirectory,
            };
        });
        res.json(temp);
    } else if (req.files && req.files.Files.length == null) {
        let files = req.files.Files;
        const typeFile = files.name.split(".")[1];
        const newName = files.name.split(".")[0] + new Date().getTime().toString();
        const dateTime = new Date().getTime();
        const saveDirectory = `${process.env.PATH_IMAGE}/${newName}.${typeFile}`;
        const pathDirectory = `${process.env.URL_DOWNLOAD}/${newName}.${typeFile}`;
        files.mv(saveDirectory);
        const temp = [{
            name: `${newName}.${typeFile}`,
            size: files.size,
            path: pathDirectory,
        }, ];
        res.json(temp);
    } else {
        res.json({ msg: "no file" });
    }
});
router.post("/delete", async(req, res, next) => {
    const payload = req.body;
    if (payload.length > 0) {
        let dataRes = [];
        for (let index = 0; index < payload.length; index++) {
            if (payload[index].status) {
                dataRes.push(payload[index]);
                if (index + 1 === payload.length) {
                    res.status(200);
                    res.json(dataRes);
                }
            } else {
                let fullPathDelete = `${process.env.PATH_IMAGE}/${payload[index].name}`;
                await fs.unlink(fullPathDelete);
                if (index + 1 === payload.length) {
                    res.status(200);
                    res.json(dataRes);
                }
            }
        }
    } else {
        res.status(400);
        res.json({ msg: "no path file" });
    }

    // res.send('ok')
});

module.exports = router;