let express = require("express");
let router = express.Router();
const fs = require("fs");
var fileUpload = require("express-fileupload");
router.use(fileUpload());
const reportFn = require("./report_fn");

router.post("/upload", async (req, res, next) => {
  try {
    let result = [];
    const files = req.files.Files;
    if (files && files.length > 0) {
      result = await createFile(files, result);
      res.json(result);
    } else {
      result = await createFile([files], result);
      res.json(result);
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});
async function createFile(files, result) {
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const nameSplitter = file.name.split("-");
      const mainFolder = `${nameSplitter[0]}-${nameSplitter[1]}-${
        nameSplitter[2]
      }-${nameSplitter[3]}-${nameSplitter[4].substring(0, 6)}`;
      console.log("🚀 ~ mainFolder:", mainFolder);
      if (!fs.existsSync(`${process.env.PATH_IMAGE}/${mainFolder}`)) {
        fs.mkdirSync(`${process.env.PATH_IMAGE}/${mainFolder}`);
      }
      const saveDirectory = `${process.env.PATH_IMAGE}/${mainFolder}/report`;
      const pathDirectory = `${process.env.URL_DOWNLOAD}/${mainFolder}/report`;
      const resultUpload = await reportFn.upload(
        file,
        saveDirectory,
        pathDirectory
      );
      result.push(resultUpload);
      if (i + 1 == files.length) {
        return result;
      }
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}

router.delete("/delete/:name", async (req, res, next) => {
  const { name } = req.params;
  const nameSplitter = name.split("-");
  const folder = `${nameSplitter[0]}-${nameSplitter[1]}-${nameSplitter[2]}-${
    nameSplitter[3]
  }-${nameSplitter[4].substring(0, 6)}`;
  const foo = await reportFn.deleteFile(
    `${process.env.PATH_IMAGE}/${folder}/report/${name}`
  );
  res.json(foo);
});

module.exports = router;
