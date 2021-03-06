const mongoose = require("mongoose");
const generateRandomToken = require("../helpers/generateRandomToken");
const agenda = require("../agenda");

const eventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      unique: true,
      index: true,
    },
    creatorId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    banner: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    startTimeStamp: {
      type: Date,
      required: true,
    },
    endTimeStamp: {
      type: Date,
      required: true,
    },
    totalParticipantsAllowed: {
      type: Number,
      default: 1,
    },
    participationFees: {
      type: Number,
      default: 0,
    },
    participants: [{ type: String, ref: "User" }],
    modules: {
      type: [String],
    },
    type: {
      type: String,
      required: true,
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
    },
    duration: {
      type: Number, // in milliseconds
    },
  },
  {
    timestamps: true,
    id: false,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

eventSchema.pre("save", async function () {
  if (!this.eventId) {
    try {
      const token = await generateRandomToken(8);
      this.eventId = "E-" + token;
    } catch (error) {
      throw error;
    }
  }
  if (!this.duration) {
    this.duration = Math.abs(
      new Date(this.endTimeStamp).getTime() -
        new Date(this.startTimeStamp).getTime()
    );
  }
});

eventSchema.post("save", async function (event) {
  const startTimeStamp = new Date(event.startTimeStamp);

  // 10 min before start time
  const when = new Date(startTimeStamp.getTime() - 10 * 60000);

  await agenda.schedule(when, "Reminder Emails", {
    eventId: event.eventId,
  });
});

eventSchema.virtual("creator", {
  ref: "User",
  localField: "creatorId",
  foreignField: "userId",
  justOne: true,
});

eventSchema.virtual("participantList", {
  ref: "User",
  localField: "participants",
  foreignField: "userId",
  justOne: false,
});

module.exports = new mongoose.model("Event", eventSchema);
