import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL || "https://javacpahgxvvjcokcupe.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({
  storage: multer.memoryStorage()
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // API Routes
  app.post("/api/upload", upload.single("image"), async (req: any, res) => {

  if (!req.file) {
    return res.status(400).json({ success: false });
  }

  const file = req.file;
  const fileName = Date.now() + "-" + file.originalname;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(fileName, file.buffer, {
      contentType: file.mimetype
    });

  if (error) {
    return res.status(500).json(error);
  }

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(fileName);

  res.json({
    success: true,
    url: data.publicUrl
  });

});

  app.get("/api/categories", async (req, res) => {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) return res.status(500).json(error);
    res.json(data);
  });

  app.post("/api/products", async (req, res) => {
  const { code, name, description, price, unit_cost, category_id, images } = req.body;

  const { data: product, error } = await supabase
    .from("products")
    .insert([{ code, name, description, price, unit_cost, category_id }])
    .select()
    .single();

  if (error) return res.status(500).json(error);

  if (images && images.length > 0) {
    const imageInserts = images.map(url => ({
      product_id: product.id,
      url
    }));

    await supabase.from("product_images").insert(imageInserts);
  }

  res.json({ success: true });
});

  // Admin Auth
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL || "admin@admin.com.br";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin1010";

    if (email === adminEmail && password === adminPassword) {
      res.json({ success: true, token: "fake-jwt-token-admin" });
    } else {
      res.status(401).json({ success: false, message: "Credenciais inválidas" });
    }
  });

  // Protected Routes (CRUD)
  app.post("/api/products", async (req, res) => {
    const { code, name, description, price, category_id, images } = req.body;
    
    const { data: product, error: prodError } = await supabase
      .from("products")
      .insert([{ code, name, description, price, category_id }])
      .select()
      .single();

    if (prodError) return res.status(500).json(prodError);

    if (images && Array.isArray(images) && images.length > 0) {
      const imageInserts = images.map(url => ({ product_id: product.id, url }));
      const { error: imgError } = await supabase.from("product_images").insert(imageInserts);
      if (imgError) console.error("Error inserting images:", imgError);
    }

    res.json({ id: product.id });
  });

  app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { code, name, description, price, unit_cost, category_id, images } = req.body;

  const { error } = await supabase
    .from("products")
    .update({ code, name, description, price, unit_cost, category_id })
    .eq("id", id);

  if (error) return res.status(500).json(error);

  await supabase.from("product_images").delete().eq("product_id", id);

  if (images && images.length > 0) {
    const imageInserts = images.map(url => ({
      product_id: id,
      url
    }));

    await supabase.from("product_images").insert(imageInserts);
  }

  res.json({ success: true });
});

  app.delete("/api/products/:id", async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return res.status(500).json(error);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
