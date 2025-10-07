require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
  origin: "http://localhost:5173",  "https://veggie-mart-frontend.vercel.app",
  credentials: true,
}));
app.use(express.json());

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI , {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// --- Product Schema & Model ---
const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  available: Boolean,
  bestSeller: Boolean,
  image: String,
  description: String,
  nutrition: String
});

const Product = mongoose.model("Product", productSchema);

// --- Routes ---

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Vegetable & Fruit Shop API is running 🚀" });
});

// Get all products with filters, sorting & search
app.get("/api/products", async (req, res) => {
  const { category, available, bestSeller, sort, search } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (available) filter.available = available === "true";
  if (bestSeller) filter.bestSeller = bestSeller === "true";
  if (search) filter.name = { $regex: search, $options: "i" };

  let query = Product.find(filter);

  // Sorting
  switch (sort) {
    case "priceAsc":
      query = query.sort({ price: 1 });
      break;
    case "priceDesc":
      query = query.sort({ price: -1 });
      break;
    case "nameAsc":
      query = query.sort({ name: 1 });
      break;
    case "nameDesc":
      query = query.sort({ name: -1 });
      break;
  }

  try {
    const products = await query.exec();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Get single product by id
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Seed database
app.post("/api/products/seed", async (req, res) => {
  try {
    await Product.deleteMany({});
    await Product.insertMany([
      { name: "Tomato", category: "Vegetable", price: 2, available: true, bestSeller: true, image: "https://images.unsplash.com/photo-1582515073490-399813d8d6a5", description: "Fresh juicy tomatoes.", nutrition: "Vitamin C & K" },
      { name: "Potato", category: "Vegetable", price: 1, available: true, bestSeller: false, image: "https://images.unsplash.com/photo-1582515073485-b7e0e39b676f", description: "Organic potatoes.", nutrition: "Potassium, Vitamin B6" },
      { name: "Carrot", category: "Vegetable", price: 2, available: true, bestSeller: true, image: "https://images.unsplash.com/photo-1617196030118-216c1f16d9c6", description: "Crunchy carrots.", nutrition: "Vitamin A, Fiber" },
      { name: "Apple", category: "Fruit", price: 3, available: true, bestSeller: true, image: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce", description: "Sweet apples.", nutrition: "Vitamin C, Fiber" },
      { name: "Banana", category: "Fruit", price: 2, available: false, bestSeller: false, image: "https://images.unsplash.com/photo-1574226516831-e1dff420e43e", description: "Energy booster bananas.", nutrition: "Potassium, Fiber" }
    ]);
    res.json({ message: " Products seeded" });
  } catch (err) {
    res.status(500).json({ error: "Failed to seed products" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
