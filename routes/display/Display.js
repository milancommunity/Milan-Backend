// All routes related to club's LOGIN AND REGISTER

const express = require("express");
const User = require("../../schema/user/UserSchema");
const { STATUSCODE, STATUSMESSAGE } = require("../../utils/Status");
const router = express.Router();

// Route 1  - Show all avaialble Users in the DB
router.get("/users", async (req, res) => {
  try {
    const allusers = await User.find({});
    res.status(STATUSCODE.OK).json(allusers);
  } catch (error) {
    res
      .status(STATUSCODE.INTERNAL_SERVER_ERROR)
      .json({ message: STATUSMESSAGE.INTERNAL_SERVER_ERROR });
  }
});

// * Route 2 - Show all available Clubs in the DB
router.get("/clubs", async (req, res) => {
  try {
    const allClubs = await User.find({ usertype: "club" });
    res.json(allClubs);
  } catch (error) {
    res
      .status(STATUSCODE.INTERNAL_SERVER_ERROR)
      .json({ message: STATUSMESSAGE.INTERNAL_SERVER_ERROR });
  }
});

module.exports = router;
