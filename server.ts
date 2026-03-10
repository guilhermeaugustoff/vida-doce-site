import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const db = new Database("vidadoce.db");
// ... (rest of the DB init stays the same)

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category_id INTEGER,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );
`);

// Seed initial categories if empty
const categoryCount = db.prepare("SELECT count(*) as count FROM categories").get() as { count: number };
if (categoryCount.count === 0) {
  const categories = ["Balas", "Chicletes", "Chocolates", "Doces", "Salgadinhos", "Bebidas", "Outros"];
  const insertCategory = db.prepare("INSERT INTO categories (name) VALUES (?)");
  categories.forEach(cat => insertCategory.run(cat));

  // Seed some initial products
  const insertProduct = db.prepare("INSERT INTO products (code, name, description, price, category_id) VALUES (?, ?, ?, ?, ?)");
  const insertImage = db.prepare("INSERT INTO product_images (product_id, url) VALUES (?, ?)");
  
  // Balas
  let info = insertProduct.run("9.500", "Bala Bolete c/ 140", "A clássica bala que vira chiclete. Sabor tutti-frutti.", 0.09, 1);
  insertImage.run(info.lastInsertRowid, "https://picsum.photos/seed/candy1/400/400");
  
  info = insertProduct.run("5.750", "Bala Chita c/ 120", "Bala mastigável sabor abacaxi, um clássico das festas.", 0.07, 1);
  insertImage.run(info.lastInsertRowid, "https://picsum.photos/seed/candy2/400/400");
  
  // Chicletes
  info = insertProduct.run("7.000", "Chiclete Big Big c/ 100", "Chiclete de bola sabor morango.", 0.09, 2);
  insertImage.run(info.lastInsertRowid, "https://picsum.photos/seed/gum1/400/400");
  
  info = insertProduct.run("12.90", "Chiclete Bubballo c/ 60", "Chiclete recheado com calda líquida.", 0.28, 2);
  insertImage.run(info.lastInsertRowid, "https://picsum.photos/seed/gum2/400/400");
  
  // Chocolates
  info = insertProduct.run("70.80", "Chocolate Kit Kat 24 x 45 gr", "Wafer recheado coberto com chocolate ao leite.", 3.78, 3);
  insertImage.run(info.lastInsertRowid, "https://picsum.photos/seed/chocolate1/400/400");
  
  info = insertProduct.run("58.50", "Chocolate Snickers c/ 20", "Barra de chocolate com amendoim, caramelo e nougat.", 3.74, 3);
  insertImage.run(info.lastInsertRowid, "https://picsum.photos/seed/chocolate2/400/400");
  
  // Doces
  info = insertProduct.run("15.73", "Doce Paçoca Aritana c/ 50", "Paçoca rolha tradicional de amendoim.", 0.42, 4);
  insertImage.run(info.lastInsertRowid, "https://picsum.photos/seed/sweet1/400/400");
  
  info = insertProduct.run("15.50", "Doce Bananada c/ 20 Cabral", "Doce de banana tradicional.", 1.17, 4);
  insertImage.run(info.lastInsertRowid, "https://picsum.photos/seed/sweet2/400/400");
  insertProduct.run("18.00", "Doce Cocada Ar Pr/Br/Cond c 20", 1.24, "https://picsum.photos/seed/sweet3/400/400", 4);
  insertProduct.run("17.00", "Doce de Leite c 20 Quad/ Los/ Bat", 1.17, "https://picsum.photos/seed/sweet4/400/400", 4);

  // Salgadinhos
  insertProduct.run("29.28", "Salgadinho Flinkitos c/ 20 100 gr.", 1.91, "https://picsum.photos/seed/snack1/400/400", 5);
  insertProduct.run("10.50", "Salgadinho Flinkitos 70 gr c/10", 1.37, "https://picsum.photos/seed/snack2/400/400", 5);
  insertProduct.run("19.68", "Salgadinho Aritana triomax 135 gr", 2.56, "https://picsum.photos/seed/snack3/400/400", 5);

  // Bebidas
  insertProduct.run("27.000", "Achocolatado c/ 27 unid. 200ml Cemil", 1.30, "https://picsum.photos/seed/drink1/400/400", 6);
  insertProduct.run("14.00", "Suco Fresh c/ 15 faz 2 lt", 1.26, "https://picsum.photos/seed/drink2/400/400", 6);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  // API Routes
  app.post("/api/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    res.json({ success: true, url: `/uploads/${req.file.filename}` });
  });

  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  app.get("/api/products", (req, res) => {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id
    `).all() as any[];

    const productsWithImages = products.map(p => {
      const images = db.prepare("SELECT url FROM product_images WHERE product_id = ?").all(p.id) as { url: string }[];
      return { ...p, images: images.map(img => img.url) };
    });

    res.json(productsWithImages);
  });

  // Admin Auth (Simple for demo)
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@admin.com.br" && password === "admin1010") {
      res.json({ success: true, token: "fake-jwt-token-admin" });
    } else {
      res.status(401).json({ success: false, message: "Credenciais inválidas" });
    }
  });

  // Protected Routes (CRUD)
  app.post("/api/products", (req, res) => {
    const { code, name, description, price, category_id, images } = req.body;
    const info = db.prepare("INSERT INTO products (code, name, description, price, category_id) VALUES (?, ?, ?, ?, ?)")
      .run(code, name, description, price, category_id);
    
    const productId = info.lastInsertRowid;
    if (images && Array.isArray(images)) {
      const insertImage = db.prepare("INSERT INTO product_images (product_id, url) VALUES (?, ?)");
      images.forEach(url => insertImage.run(productId, url));
    }
    res.json({ id: productId });
  });

  app.put("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const { code, name, description, price, category_id, images } = req.body;
    db.prepare("UPDATE products SET code = ?, name = ?, description = ?, price = ?, category_id = ? WHERE id = ?")
      .run(code, name, description, price, category_id, id);
    
    // Update images: delete old ones and insert new ones
    db.prepare("DELETE FROM product_images WHERE product_id = ?").run(id);
    if (images && Array.isArray(images)) {
      const insertImage = db.prepare("INSERT INTO product_images (product_id, url) VALUES (?, ?)");
      images.forEach(url => insertImage.run(id, url));
    }
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
