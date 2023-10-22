const express = require("express");
const router = express.Router();
const Event = require("../../schema/events/EventSchema");
const { STATUSCODE, STATUSMESSAGE } = require("../../utils/Status");
const { setTime } = require("../../utils/SetTime");

router.get("/", async (req, res) => {
  try {
    if (req.query.slug) {
      const eventDetails = await Event.findOne({ slug: req.query.slug });

      if (eventDetails) {
        return res.status(STATUSCODE.OK).json(eventDetails);
      }
      return res
        .status(STATUSCODE.NOT_FOUND)
        .json({ message: STATUSMESSAGE.NOT_FOUND });
    }

    const allEvents = await Event.find({});
    res.status(STATUSCODE.OK).json(allEvents);
  } catch (error) {
    return res
      .status(STATUSCODE.INTERNAL_SERVER_ERROR)
      .json({ message: STATUSMESSAGE.INTERNAL_SERVER_ERROR });
  }
});

router.post("/create", async (req, res) => {
  try {
    const { slug, ...data } = req.body;
    const existingEvent = await Event.findOne({ slug });

    if (existingEvent) {
      return res
        .status(STATUSCODE.CONFLICT)
        .json({ message: STATUSMESSAGE.EVENT_SLUG_ALREADY_EXISTS });
    }

    const newEvent = await new Event({
      ...data,
      slug,
      createdAt: setTime(),
      updatedAt: setTime(),
    });

    const savedEvent = await newEvent.save();
    return res.status(STATUSCODE.CREATED).json(savedEvent);
  } catch (error) {
    console.log(error);
    return res
      .status(STATUSCODE.INTERNAL_SERVER_ERROR)
      .json({ message: STATUSMESSAGE.CREATE_EVENT_FAILED });
  }
});

module.exports = router;
