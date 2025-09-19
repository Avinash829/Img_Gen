import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import generateRoute from "./routes/generate.js";
import { log } from "./utils/logger.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

app.use("/api/generate", generateRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => log(`Backend running on http://localhost:${PORT}`));
