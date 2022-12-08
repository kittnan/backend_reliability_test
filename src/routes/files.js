let express = require("express");
let router = express.Router();
const fs = require("fs");
var fileUpload = require("express-fileupload");
router.use(fileUpload());
const reportFn = require("./report_fn");
router.post("/upload", async(req, res, next) => {
    let result = [];
    if (req.files && req.files.Files.length > 0) {
        let files = req.files.Files;
        try {
            for (let i = 0; i < files.length; i++) {
                const nameSplitter = files[i].name.split("-");
                const folder = `${nameSplitter[0]}-${nameSplitter[1]}-${nameSplitter[2]}-${nameSplitter[3]}-${nameSplitter[4]}`;
                if (!fs.existsSync(`${process.env.PATH_IMAGE}/${folder}`)) {
                    fs.mkdirSync(`${process.env.PATH_IMAGE}/${folder}`)
                }
                const saveDirectory = `${process.env.PATH_IMAGE}/${folder}/attachment`;
                const pathDirectory = `${process.env.URL_DOWNLOAD}/${folder}/attachment`;
                const foo = await reportFn.upload(
                    files[i],
                    saveDirectory,
                    pathDirectory
                );
                result.push(foo);
                if (i + 1 == files.length) {
                    res.json(result);
                }
            }
        } catch (error) {
            console.log(error);
            res.json(error);
        }
    } else if (req.files && req.files.Files.length == null) {
        let files = req.files.Files;
        const nameSplitter = files.name.split("-");
        const folder = `${nameSplitter[0]}-${nameSplitter[1]}-${nameSplitter[2]}-${nameSplitter[3]}-${nameSplitter[4]}`;
        if (!fs.existsSync(`${process.env.PATH_IMAGE}/${folder}`)) {
            fs.mkdirSync(`${process.env.PATH_IMAGE}/${folder}`)
        }
        const saveDirectory = `${process.env.PATH_IMAGE}/${folder}/attachment`;
        const pathDirectory = `${process.env.URL_DOWNLOAD}/${folder}/attachment`;
        const foo = await reportFn.upload(files, saveDirectory, pathDirectory);
        result.push(foo);
        res.json(result);
    } else {
        res.json({ msg: "no file" });
    }
});

router.delete("/delete/:name", async(req, res, next) => {
    const { name } = req.params;
    const nameSplitter = name.split("-");
    const folder = `${nameSplitter[0]}-${nameSplitter[1]}-${nameSplitter[2]}-${nameSplitter[3]}-${nameSplitter[4]}`;
    const foo = await reportFn.deleteFile(`${process.env.PATH_IMAGE}/${folder}/attachment/${name}`);
    res.json(foo);
});

// router.post("/delete", async(req, res, next) => {
//     const payload = req.body;
//     if (payload.length > 0) {
//         let dataRes = [];
//         for (let index = 0; index < payload.length; index++) {
//             if (payload[index].status) {
//                 dataRes.push(payload[index]);
//                 if (index + 1 === payload.length) {
//                     res.status(200);
//                     res.json(dataRes);
//                 }
//             } else {
//                 let fullPathDelete = `${process.env.PATH_IMAGE}/${payload[index].name}`;
//                 await fs.unlink(fullPathDelete);
//                 if (index + 1 === payload.length) {
//                     res.status(200);
//                     res.json(dataRes);
//                 }
//             }
//         }
//     } else {
//         res.status(400);
//         res.json({ msg: "no path file" });
//     }

//     // res.send('ok')
// });

module.exports = router;