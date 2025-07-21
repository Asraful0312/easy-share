import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "delete expired pins",
  "0 0 * * *",
  internal.pins.deleteExpiredPins,
  {}
);

crons.cron(
  "reset daily upload limits",
  "0 0 * * *", // Run daily at midnight UTC
  internal.pins.resetDailyUploadLimits,
  {}
);

export default crons;
