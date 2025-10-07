require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/shopDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("✅ Connected to MongoDB");
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
  res.json({ message: "Vegetable & Fruit Shop API is running " });
});

//  Get all products with filters, sorting & search
app.get("/api/products", async (req, res) => {
  const { category, available, bestSeller, sort, search } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (available) filter.available = available === "true";
  if (bestSeller) filter.bestSeller = bestSeller === "true";

  // 🔍 Search by product name (case insensitive)
  if (search) {
    filter.name = { $regex: search, $options: "i" };
    

  let query = Product.find(filter);

  // --- Sorting ---
  switch (sort) {
    case "price_asc":
      query = query.sort({ price: 1 });
      break;
    case "price_desc":
      query = query.sort({ price: -1 });
      break;
    case "name_asc":
      query = query.sort({ name: 1 });
      break;
    case "name_desc":
      query = query.sort({ name: -1 });
      break;
    default:
      break;
  }

  try {
    const products = await query.exec();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Seed database with sample data
app.post("/api/products/seed", async (req, res) => {
  try {
    await Product.deleteMany({});
    await Product.insertMany([
      { name: "Tomato", category: "Vegetable", price: 2, available: true, bestSeller: true, image: "https://images.unsplash.com/photo-1582515073490-399813d8d6a5", description: "Fresh juicy tomatoes, great for salads.", nutrition: "Rich in Vitamin C & K" },
      { name: "Potato", category: "Vegetable", price: 1, available: true, bestSeller: false, image: "https://images.unsplash.com/photo-1582515073485-b7e0e39b676f", description: "Organic potatoes full of energy.", nutrition: "Carbohydrates, Potassium, Vitamin B6" },
      { name: "Carrot", category: "Vegetable", price: 2, available: true, bestSeller: true, image: "https://images.unsplash.com/photo-1617196030118-216c1f16d9c6", description: "Crunchy carrots perfect for juices.", nutrition: "Vitamin A, Beta-carotene, Fiber" },
      { name: "Apple", category: "Fruit", price: 3, available: true, bestSeller: true, image: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce", description: "Sweet and fresh red apples.", nutrition: "Vitamin C, Fiber, Antioxidants" },
      { name: "Banana", category: "Fruit", price: 2, available: false, bestSeller: false, image: "https://images.unsplash.com/photo-1574226516831-e1dff420e43e", description: "Natural energy booster bananas.", nutrition: "Potassium, Vitamin B6, Fiber" }
    ]);
    res.json({ message: "✅ Sample products inserted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to seed products" });
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

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
 