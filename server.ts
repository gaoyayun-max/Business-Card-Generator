import cors from "cors";
import express from "express";
import multer from "multer";
import nodemailer from "nodemailer";
import path from "path";
import { createServer as createViteServer } from "vite";

const upload = multer({ storage: multer.memoryStorage() });

let transporter: nodemailer.Transporter | null = null;

async function setupMailer() {
  try {
    console.log("Configuring SMTP email account...");
    transporter = nodemailer.createTransport({
      host: "smtp.fastmail.com",
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || "it@it.ecohash.com",
        pass: process.env.SMTP_PASS || "5j366x677w8v7c8k",
      },
    });
    // Verify connection configuration
    await transporter.verify();
    console.log("SMTP account ready.");
  } catch (err) {
    console.error("Failed to generate SMTP account", err);
  }
}

async function startServer() {
  await setupMailer();

  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  // API routing must be defined BEFORE Vite middleware setup!
  app.post(
    "/api/submit-card",
    upload.fields([
      { name: "frontSvg", maxCount: 1 },
      { name: "backSvg", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };

        const frontSvgBuffer = files["frontSvg"]?.[0]?.buffer;
        const backSvgBuffer = files["backSvg"]?.[0]?.buffer;

        if (!frontSvgBuffer || !backSvgBuffer) {
           res.status(400).json({ success: false, message: "Missing SVG files" });
           return;
        }

        if (!transporter) {
           res.status(500).json({ success: false, message: "Email service not initialized" });
           return;
        }

        // send mail with defined transport object
        const senderName = req.body.name || '员工';
        const info = await transporter.sendMail({
          from: '"BizCard Generator" <it@it.ecohash.com>', // sender address
          to: "guochunxiu@ecohash.com, gaoyayun@ecohash.com", // list of receivers
          subject: "新名片制作申请 (New Business Card Request)", // Subject line
          text: `【${senderName}】发起了名片制作需求，请下载附件 SVG 文档进行印制。`, // plain text body
          html: `<p>【<b>${senderName}</b>】发起了名片制作需求，请下载附件 SVG 文档进行印制。</p>`, // html body
          attachments: [
            {
              filename: "business-card-front.svg",
              content: frontSvgBuffer,
            },
             {
              filename: "business-card-back.svg",
              content: backSvgBuffer,
            },
          ],
        });

        console.log("Message sent: %s", info.messageId);

        res.json({ success: true, previewUrl: null });
      } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  );

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
