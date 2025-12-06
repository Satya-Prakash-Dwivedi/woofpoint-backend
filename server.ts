import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import userRoutes from "./routes/user.routes"
import trainerRoutes from "./routes/trainer.routes"
import ownerRoutes from "./routes/owner.routes"
import path from "path"
import dotenv from "dotenv"

// Default to 'development' if NODE_ENV isn't set
const nodeEnv = process.env.NODE_ENV || 'development';

dotenv.config({
  path: path.resolve(__dirname , `./.env.${nodeEnv}` )
})

// Check mongodb connection
if (!process.env.MONGODB_URI) {
  console.error("FATAL ERROR: ❌ MONGODB_URI is not defined.");
  process.exit(1);
}

const PORT = process.env.PORT || 3001;
const app = express()

app.use(cors())
app.use(express.json())

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "Server is UP now" });
});

app.use("/api/auth", userRoutes)
app.use("/api/trainer", trainerRoutes)
app.use("/api/owner", ownerRoutes);

const startServer = async () => {
   try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(`MongoDB Connection ✅ (Env: ${nodeEnv})`);
     app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
   } catch (err) {
     console.error("❌ Failed to start server:", err);
     process.exit(1);
  }
};

 startServer();