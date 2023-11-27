// All routes related to club's LOGIN AND REGISTER

const express = require("express");
const User = require("../../schema/user/UserSchema");
const { STATUSCODE } = require("../../utils/Status");
const router = express.Router();

// Route 1  - Show all avaialble Users in the DB
router.get("/users", async (req, res) => {
  try {
    const allusers = await User.find({});
    res.status(STATUSCODE.OK).json(allusers);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// * Route 2 - Show all available Clubs in the DB
router.get("/clubs", async (req, res) => {
  try {
    const allClubs = await User.find({ userType: "club" });
    res.json(allClubs);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
