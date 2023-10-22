const express = require("express");
const User = require("../../schema/user/UserSchema");
const { STATUSCODE, STATUSMESSAGE } = require("../../utils/Status");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    if (req.query.slug) {
      const clubdetails = await User.findOne({ slug: req.query.slug });
      return res.status(STATUSCODE.OK).json(clubdetails);
    }

    const clubs = await User.find({
      usertype: "club",
    });

    res.json(clubs);
  } catch (error) {
    res
      .status(STATUSCODE.INTERNAL_SERVER_ERROR)
      .json({ message: STATUSMESSAGE.INTERNAL_SERVER_ERROR });
  }
});

module.exports = router;
