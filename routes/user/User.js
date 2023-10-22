const express = require("express");
const User = require("../../schema/user/UserSchema");
const router = express.Router();
const bcrypt = require("bcryptjs");
const ReportProblem = require("../../schema/user/ReportProblemSchema");
const { STATUSCODE, STATUSMESSAGE } = require("../../utils/Status");

// Route 1 - Update User details
router.post("/update", async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      return res
        .status(STATUSCODE.NOT_FOUND)
        .json({ message: STATUSMESSAGE.USER_NOT_FOUND });
    }
    // User Exists in the database
    const validPassword = await bcrypt.compare(
      oldPassword,
      existingUser.password,
    );

    if (!validPassword) {
      return res
        .status(STATUSCODE.UNAUTHORIZED)
        .json({ message: STATUSMESSAGE.INVALID_CREDENTIALS });
    }
    // Old Password Mathched
    if (newPassword.length < 5) {
      return res
        .status(406)
        .json({ message: "Password Length must be greater than 5 characters" });
    }
    // Correct Password Length

    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    // New Password Hashed

    // Updated User
    const UserData = {
      firstname: existingUser.firstname,
      lastname: existingUser.lastname,
      email: email,
      password: newHashedPassword,
      address: existingUser.address,
      pincode: existingUser.pincode,
    };

    await User.replaceOne({ email: email }, UserData);
    res
      .status(STATUSCODE.CREATED)
      .json({ message: STATUSMESSAGE.PASSWORD_UPDATE_SUCCESS });
  } catch (error) {
    // User Password Updated
    res
      .status(STATUSCODE.INTERNAL_SERVER_ERROR)
      .json({ message: STATUSMESSAGE.INTERNAL_SERVER_ERROR });
  }
});

// Route 2 - Report a problem
router.post("/report", async (req, res) => {
  try {
    const currentHour = new Date().getMinutes();
    const previousReports = await ReportProblem.find({
      email: req.body.email,
    }).exec();

    for (let i = 0; i < previousReports.length; i++) {
      let hourOfThisReport = new Date(
        previousReports[i].createdAt,
      ).getMinutes();

      if (hourOfThisReport >= currentHour - 120) {
        return res.status(STATUSCODE.TOO_MANY_REQUESTS).json({
          success: false,
          message: STATUSMESSAGE.TOO_MANY_REQUESTS,
        });
      }
    }

    const data = req.body;

    const ReportData = ReportProblem({
      firstname: data.firstname,
      lastname: data.lastname,
      email: data.email,
      reportmessage: data.reportmessage,
    });

    await ReportData.save();
    res.status(STATUSCODE.OK).json({ success: true });
  } catch (e) {
    res
      .status(STATUSCODE.INTERNAL_SERVER_ERROR)
      .json({ message: STATUSMESSAGE.INTERNAL_SERVER_ERROR });
  }
});

router.get("/", async (req, res) => {
  try {
    if (req.query.slug) {
      const userdetails = await User.findOne({ slug: req.query.slug });
      return res.status(STATUSCODE.OK).json(userdetails);
    }

    const users = await User.find({
      usertype: "individual",
    });

    res.json(users);
  } catch (error) {
    res
      .status(STATUSCODE.INTERNAL_SERVER_ERROR)
      .json({ message: STATUSMESSAGE.INTERNAL_SERVER_ERROR });
  }
});

module.exports = router;
