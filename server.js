require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/studentDB";
const app = express();
app.use(express.json());

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    age: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isInteger,
    },
    department: { type: String, required: true, trim: true },
  },
  { timestamps: true, collection: "students", versionKey: false },
);

const Student = mongoose.model("Student", studentSchema);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Student API is running.",
    routes: {
      health: "GET /health",
      createStudent: "POST /students",
      listStudents: "GET /students",
      getStudent: "GET /students/:id",
      updateStudent: "PATCH /students/:id",
      deleteStudent: "DELETE /students/:id",
    },
  });
});

function validateStudentInput(body, partial = false) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object." };
  }

  const fields = ["name", "email", "age", "department"];
  const student = {};

  for (const field of fields) {
    if (!(field in body)) {
      if (!partial) return { error: `${field} is required.` };
      continue;
    }

    const value = body[field];
    if (field === "age") {
      if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
        return { error: "Age must be a positive whole number." };
      }
      student.age = value;
      continue;
    }

    if (typeof value !== "string" || value.trim() === "") {
      return { error: `${field} must be a non-empty string.` };
    }
    student[field] = value.trim();
  }

  if (student.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
    return { error: "Email must be valid." };
  }
  if (Object.keys(student).length === 0) {
    return { error: "Provide at least one student field to update." };
  }

  return { student };
}

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Student API is running." });
});

app.post(["/students", "/api/students"], async (req, res, next) => {
  const { student, error } = validateStudentInput(req.body);
  if (error) return res.status(400).json({ success: false, message: error });

  try {
    const createdStudent = await Student.create(student);
    return res.status(201).json({ success: true, data: createdStudent });
  } catch (err) {
    return next(err);
  }
});

app.get(["/students", "/api/students"], async (req, res, next) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: students });
  } catch (err) {
    return next(err);
  }
});

app.get(["/students/:id", "/api/students/:id"], async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid student ID." });
  }

  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }
    return res.json({ success: true, data: student });
  } catch (err) {
    return next(err);
  }
});

async function updateStudent(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid student ID." });
  }

  const { student, error } = validateStudentInput(req.body, true);
  if (error) return res.status(400).json({ success: false, message: error });

  try {
    const updatedStudent = await Student.findByIdAndUpdate(req.params.id, student, {
      new: true,
      runValidators: true,
    });
    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }
    return res.json({ success: true, data: updatedStudent });
  } catch (err) {
    return next(err);
  }
}

app.put(["/students/:id", "/api/students/:id"], updateStudent);
app.patch(["/students/:id", "/api/students/:id"], updateStudent);

app.delete(["/students/:id", "/api/students/:id"], async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid student ID." });
  }

  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }
    return res.json({ success: true, message: "Student deleted successfully." });
  } catch (err) {
    return next(err);
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ success: false, message: "Invalid JSON body." });
  }
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A student with this email already exists.",
    });
  }
  if (err.name === "ValidationError" || err.name === "CastError") {
    return res.status(400).json({ success: false, message: err.message });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: "Internal server error." });
});

const port = Number(process.env.PORT) || 3000;

async function connectDB() {
  try {
    await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  } catch (err) {
    console.error(
      "MongoDB connection error. Make sure MongoDB is installed and running, or set MONGODB_URI in .env.",
      err.message,
    );
    throw err;
  }
}

async function startServer() {
  await connectDB();

  await new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}: http://localhost:${port}`);
      resolve();
    });

    server.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        reject(
          new Error(
            `Port ${port} is already in use. Stop the other server or set a different PORT in .env.`,
          ),
        );
        return;
      }
      reject(err);
    });
  });
}

if (require.main === module) {
  startServer().catch(async (err) => {
    console.error("Failed to start the Student API:", err.message);
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error("Failed to close the MongoDB connection:", disconnectError.message);
    }
    process.exitCode = 1;
  });
}

module.exports = { app, validateStudentInput };
