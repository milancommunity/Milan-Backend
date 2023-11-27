const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../../schema/user/UserSchema");
const bcrypt = require("bcryptjs");
const { STATUSCODE, STATUSMESSAGE } = require("../../utils/Status");

// Route 1  - User Signup
router.post("/signup", async (req, res) => {
  try {
    const { email, ...data } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res
        .status(STATUSCODE.CONFLICT)
        .json({ message: STATUSMESSAGE.USER_ALREADY_EXISTS });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = new User({
      ...data,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    res
      .status(STATUSCODE.CREATED)
      .json({ message: STATUSMESSAGE.SIGNUP_SUCCESS });
  } catch (err) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).json({ message: err });
  }
});

// Route 2 - User Login
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const validPassword = await bcrypt.compare(password, existingUser.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const payload = { User: { id: existingUser.email } };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res
      .status(201)
      .cookie("Token", token, {
        sameSite: "none",
        httpOnly: true,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        secure: true,
        domain: process.env.ORIGIN_DOMAIN,
      })
      .cookie("username", existingUser.slug, {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        domain: process.env.ORIGIN_DOMAIN,
      })
      .cookie("isLoggedIn", true, {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: false,
        secure: true,
        sameSite: "none",
        domain: process.env.ORIGIN_DOMAIN,
      })
      .cookie("usertype", existingUser.userType, {
        httpOnly: false,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        secure: true,
        sameSite: "none",
        domain: process.env.ORIGIN_DOMAIN,
      })

      .json({
        message: "Logged you in !",
      });
  } catch (err) {
    res.status(STATUSCODE.INTERNAL_SERVER_ERROR).json({ message: err });
  }
});

// Route 3 - User Update
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

// Route 4  - Google Authentication
router.get("/google", (req, res) => {
  const googleAuthURL = "https://accounts.google.com/o/oauth2/v2/auth";

  const params = new URLSearchParams({
    response_type: "code",
    redirect_uri: process.env.CALLBACK_URL,
    scope: "profile email ",
    client_id: process.env.CLIENT_ID,
    state: req.query.usertype,
  });

  const redirectURL = `${googleAuthURL}?${params}`;

  return res.status(STATUSCODE.CREATED).json({ url: redirectURL });
});

// Route 5  - Google Authentication callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "auth/login/failed",
  }),
  async (req, res) => {
    const usertype = req.query.state;
    if (req.isAuthenticated()) {
      const user = req.user;
      try {
        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          // This is a new account, update usertype
          await User.create({
            email: user.email,
            userType: usertype,
          });
        }
        res
          .cookie("OAuthLoginInitiated", true, {
            expires: new Date(new Date().getTime() + 5 * 60 * 1000),
            httpOnly: false,
            secure: true,
            sameSite: "none",
            domain: process.env.ORIGIN_DOMAIN,
          })
          .redirect(process.env.successURL);
      } catch (err) {
        res.status(STATUSCODE.INTERNAL_SERVER_ERROR).json({ message: err });
      }
    } else {
      res
        .status(STATUSCODE.UNAUTHORIZED)
        .json({ error: true, message: STATUSMESSAGE.UNAUTHORIZED });
    }
  },
);

// Route 6  - Google Authentication Failure
router.get("/login/failed", (req, res) => {
  res
    .status(STATUSCODE.UNAUTHORIZED)
    .json({ error: true, message: STATUSMESSAGE.UNAUTHORIZED });
});

// Route 7  - google authentication success
router.get("/login/success", (req, res) => {
  if (req.user) {
    const data = { User: { id: req.user.email } };
    const token = jwt.sign(data, process.env.JWT_SECRET);

    res
      .status(STATUSCODE.OK)
      .cookie("OAuthLoginInitiated", false, {
        expires: new Date(0),
        httpOnly: false,
        secure: true,
        sameSite: "none",
        domain: process.env.ORIGIN_DOMAIN,
      })
      .cookie("Token", token, {
        sameSite: "none",
        httpOnly: true,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        secure: true,
        domain: process.env.ORIGIN_DOMAIN,
      })
      .cookie("username", req.user.slug, {
        httpOnly: false,
        secure: true,
        sameSite: "none",
        domain: process.env.ORIGIN_DOMAIN,
      })
      .cookie("isLoggedIn", true, {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: false,
        secure: true,
        sameSite: "none",
        domain: process.env.ORIGIN_DOMAIN,
      })
      .cookie("usertype", "user", {
        httpOnly: false,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        secure: true,
        sameSite: "none",
        domain: process.env.ORIGIN_DOMAIN,
      })
      .json({
        message: STATUSMESSAGE.LOGIN_SUCCESS,
      });
  } else {
    res
      .status(STATUSCODE.UNAUTHORIZED)
      .json({ error: true, message: STATUSMESSAGE.UNAUTHORIZED });
  }
});

router.get("/logout", (req, res) => {
  res
    .status(STATUSCODE.OK)
    .cookie("Token", false, {
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: process.env.ORIGIN_DOMAIN,
    })
    .cookie("username", false, {
      expires: new Date(0),
      httpOnly: false,
      secure: true,
      sameSite: "none",
      domain: process.env.ORIGIN_DOMAIN,
    })
    .cookie("isLoggedIn", false, {
      expires: new Date(0),
      httpOnly: false,
      secure: true,
      sameSite: "none",
      domain: process.env.ORIGIN_DOMAIN,
    })
    .cookie("usertype", false, {
      expires: new Date(0),
      httpOnly: false,
      secure: true,
      sameSite: "none",
      domain: process.env.ORIGIN_DOMAIN,
    })

    .json({
      message: STATUSMESSAGE.LOGOUT_SUCCESS,
    });
});

module.exports = router;
