const express = require("express");

const router = express.Router();

const eventController = require("../controllers/eventController");

const { isAuth } = require("../middlewares/auth");
const {
  correctParticipantCount,
  splitParticipationToken,
  validateParticipationToken,
  validTimeStamps,
  validateModules,
} = require("../middlewares/events");

router.get("/all", isAuth, eventController.getAllEvent);

router.get("/created", isAuth, eventController.getCreatedEvents);

router.get("/invited", isAuth, eventController.getInvitedEvents);

router.get("/modules", isAuth, eventController.getModules);

router.get("/:eventId", eventController.getEvent);

router.post(
  "/",
  isAuth,
  validTimeStamps,
  correctParticipantCount,

  eventController.postEvent
);

router.post(
  "/participate",
  isAuth,
  validateParticipationToken,
  splitParticipationToken,
  validateModules,
  eventController.postParticipate
);

module.exports = router;
