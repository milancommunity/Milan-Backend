const express = require("express");
const User = require("../../schema/user/UserSchema");
const router = express.Router();
const bcrypt = require("bcryptjs");
const ReportProblem = require("../../schema/user/ReportProblemSchema");
const { STATUSCODE } = require("../../utils/Status");

// Route 1 - Update User details
router.post("/update", async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    // User Exists in the database
    const validPassword = await bcrypt.compare(
      oldPassword,
      existingUser.password,
    );

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid Credentials" });
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
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      email: email,
      password: newHashedPassword,
      address: existingUser.address,
      pincode: existingUser.pincode,
    };

    await User.replaceOne({ email: email }, UserData);
    res.status(201).json({ message: "Password Updated Successfully" });
  } catch (error) {
    // User Password Updated
    res
      .status(STATUSCODE.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal Server Error" });
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
        return res.status(429).json({
          success: false,
          message: "You have already reported a problem in the last 2 hours.",
        });
      }
    }

    const data = req.body;

    const ReportData = ReportProblem({
      firstName: data.firstname,
      lastName: data.lastname,
      email: data.email,
      reportMessage: data.reportmessage,
    });

    await ReportData.save();
    res.status(200).json({ success: true });
  } catch (e) {
    res
      .status(STATUSCODE.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    if (req.query.slug) {
      const userdetails = await User.findOne({ slug: req.query.slug });
      return res.status(200).json(userdetails);
    }

    const users = await User.find({
      userType: "individual",
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
