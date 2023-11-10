let express = require("express");
let router = express.Router();
let axios = require("axios");

let User = require("../models/user");

router.post("/auth", async (req, res, next) => {
  try {
    const payload = req.body;
    const adAcc = await axios.post("http://10.200.90.152:4038/AzureLogin/getByCondition", {
      username: payload.username,
      password: payload.password,
    });
    console.log("🚀 ~ adAcc:", adAcc.data);
    if (adAcc?.data == "User not found") {
      const resDB = await User.aggregate([
        {
          $match: {
            username: payload.username,
            password: payload.password,
          },
        },
      ]);
      res.json(resDB);
    } else {
      const resDB = await User.aggregate([
        {
          $match: {
            username: adAcc.data.description,
          },
        },
      ]);
      res.json(resDB);
    }
  } catch (error) {
    console.log("🚀 ~ error:", error);
    res.sendStatus(500);
  }
});

module.exports = router;
