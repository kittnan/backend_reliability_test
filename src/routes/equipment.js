let express = require("express");
let router = express.Router();
const ObjectId = require("mongodb").ObjectID;
const EQUIPMENT = require("../models/equipment");

router.get("", async (req, res, next) => {
  try {
    let { name } = req.query
    let con = [
      {
        $match: {

        }
      }
    ]
    if (name) {
      con.push({
        $match: {
          name: name
        }
      })
    }
    const data = await EQUIPMENT.aggregate(con)
    res.json(data)
  } catch (error) {
    console.log("🚀 ~ error:", error)
    res.sendStatus(500)
  }
});

router.post("/createOrUpdate", async (req, res, next) => {
  try {
    let form = req.body.map(item => {
      return {
        updateOne: {
          filter: {
            _id: new ObjectId(item._id)
          },
          update: {
            $set: item,
          },
          upsert: true
        }
      }
    })
    const data = await EQUIPMENT.bulkWrite(form)
    res.json(data)
  } catch (error) {
    console.log("🚀 ~ error:", error)
    res.sendStatus(500)
  }
});
router.post("/insert", async (req, res, next) => {
  EQUIPMENT.insertMany(req.body, (err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

router.delete("/deleteById", async (req, res, next) => {
  try {
    const { _id } = req.query;
    const data = await EQUIPMENT.deleteMany({ _id: new ObjectId(_id) })
    res.json(data)
  } catch (error) {
    console.log("🚀 ~ error:", error)
    res.sendStatus(500)
  }
});

module.exports = router;
