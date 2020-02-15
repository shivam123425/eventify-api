const Event = require("../models/Event");
const User = require("../models/User");
const manageParticipationTokens = require("../workers/manageParticipationTokens");
const calcExpirationInSeconds = require("../helpers/calcExpirationInSeconds");

exports.getEvent = async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const foundEvent = await Event.findOne({ eventId })
      .select("creatorId creator startTimeStamp endTimeStamp eventId -_id")
      .populate("creator", "username email userId -_id")
      .exec();
    if (!foundEvent) {
      const error = new Error("No such event exists!");
      error.statusCode = 404;
      return next(error);
    }
    res.json({
      success: true,
      event: foundEvent
    });
  } catch (error) {
    next(error);
  }
};

exports.postEvent = async (req, res, next) => {
  try {
    const eventObject = {
      creatorId: req.user.userId,
      startTimeStamp: new Date(req.body.startTimeStamp),
      endTimeStamp: new Date(req.body.endTimeStamp),
      totalParticipantsAllowed: req.body.totalParticipantsAllowed,
      title: req.body.title,
      description: req.body.description
    };
    // Create and save event
    const newEvent = new Event(eventObject);
    await newEvent.save();

    await User.findOneAndUpdate(
      { userId: req.user.userId },
      { $push: { events: newEvent._id } }
    );

    // send emails to participants
    manageParticipationTokens(
      newEvent,
      req.user.username,
      req.body.emailArr,
      calcExpirationInSeconds(newEvent.startTimeStamp, newEvent.endTimeStamp)
    );

    res.status(201).json({
      success: true,
      eventId: newEvent.eventId
    });
  } catch (error) {
    next(error);
  }
};

exports.postParticipate = async (req, res, next) => {
  try {
    const foundEvent = await Event.findOne({ eventId: req.body.eventId });
    if (!foundEvent) {
      const error = new Error("Invalid participation token");
      error.statusCode = 403;
      return next(error);
    }
    // check if user has already confirmed his seat for the event
    if (foundEvent.participants.includes(req.user._id.toString())) {
      const error = new Error("You have already confirmed your seat");
      error.statusCode = 403;
      return next(error);
    }

    foundEvent.participants.push(req.user._id);
    await foundEvent.save();
    
    res.json({
      success: true
    });
  } catch (error) {
    next(error);
  }
};
