import "dotenv/config";
import express from "express";
import cors from "cors";
import { chatRouter } from "./routes/chat.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/chat", chatRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const port = process.env.PORT ? Number(process.env.PORT) : 8787;
app.listen(port, () => {
  console.log(`Servidor do Bot de Atendimento rodando na porta ${port}`);
});
