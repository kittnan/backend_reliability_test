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

router.get("/convertAuth", async(req, res, next) => {
    const users = await User.aggregate([{ $match: {} }]);
    const arr = users.map((u) => {
        return {
            ...u,
            authorize: JSON.parse(u.authorize),
        };
    });

    for (let i = 0; i < arr.length; i++) {
        await User.updateOne({ _id: arr[i]._id }, { $set: { authorize: arr[i].authorize } });
        if (i + 1 === arr.length) {
            res.status(200).send("ok");
        }
    }
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
    const { id } = req.params;
    User.findById(id).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});
router.get("/section/:section/:level", (req, res, next) => {
    const { section, level } = req.params;
    const newSection = JSON.parse(section);
    const newLevel = JSON.parse(level);

    console.log(newSection, newLevel);

    const condition = [{
        $match: {
            section: {
                $in: newSection,
            },
            authorize: {
                $in: newLevel,
            },
        },
    }, ];

    if (newSection.length === 0) {
        delete condition[0]["$match"].section;
    }
    User.aggregate(condition).exec((err, result) => {
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    });
});
// router.get("/section/:section", (req, res, next) => {
//     const { section } = req.params;
//     User.find({ section: section }).exec((err, result) => {
//         if (err) {
//             res.json(err);
//         } else {
//             res.json(result);
//         }
//     });
// });

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