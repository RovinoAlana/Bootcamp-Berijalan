import express from "express";
import cors from "cors";
import { MErrorHandler } from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.route.js"; 
import { connectRedis } from "./configs/redis.config.js"; 
const app = express();

connectRedis();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth", authRoutes);
app.use(MErrorHandler);

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});