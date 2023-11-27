const express = require("express");
const User = require("../../schema/user/UserSchema");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (req.query.slug) {
      const clubdetails = await User.findOne({ slug: req.query.slug });
      return res.status(200).json(clubdetails);
    }

    const clubs = await User.find({
      userType: "club",
    });

    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
