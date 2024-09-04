const mongoose = require("mongoose");

const subTaskSchema = new mongoose.Schema({
   title: String,
   completed: {
      type: Boolean,
      default: false,
   },
});

const taskSchema = new mongoose.Schema({
   title: {
      type: String,
      required: [true, "Please provide a title"],
      maxlength: 80,
      trim: true,
   },
   description: {
      type: String,
      trim: true,
   },
   isUrgent: {
      type: Boolean,
      default: false,
   },
   dueDate: {
      type: Date,
   },
   tags: {
      type: [String],
      default: [],
   },
   subTasks: {
      type: [subTaskSchema],
      default: [],
   },
   timeSpent: {
      type: Number,
      default: 0,
   },
   status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "archived"],
      default: "pending",
   },
   createdAt: {
      type: Date,
      default: Date.now,
   },
   updatedAt: {
      type: Date,
   },
   createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide user"],
   },
});

taskSchema.pre("save", function (next) {
   this.updatedAt = Date.now();
   next();
});

module.exports = mongoose.model("Task", taskSchema);
