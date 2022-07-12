let express = require("express");
let router = express.Router();

let User = require("../models/user");

router.post("/login", (req, res, next) => {
    User.find({ username: req.body.username, password: req.body.password },
        (err, result) => {
            if (err) {
                res.json(err);
            } else {
                res.json(result);
            }
        }
    );
});

router.get("/", (req, res, next) => {
    User.find({}).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});
router.get("/id/:id", (req, res, next) => {
    const { id } = req.params
    User.findById(id).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.post("/insert", async(req, res, next) => {
    const count = await User.countDocuments({
        employee_ID: req.body.employee_ID,
    });
    if (count == 0) {
        User.insertMany(req.body, (err, result) => {
            if (err) {
                res.json(err);
            } else {
                res.json(result);
            }
        });
    } else {
        res.json([]);
    }
});
router.put("/update/:id", (req, res, next) => {
    const { id } = req.params;
    User.updateMany({ _id: id }, { $set: req.body }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

router.delete("/delete/:id", (req, res, next) => {
    const { id } = req.params;
    User.deleteOne({ _id: id }).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});

module.exports = router;