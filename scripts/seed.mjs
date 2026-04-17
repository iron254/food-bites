import mysql from "mysql2/promise";
import { URL } from "url";

// Parse DATABASE_URL to get connection details
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

let connectionConfig;
try {
  const url = new URL(databaseUrl);
  connectionConfig = {
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: url.searchParams.get("ssl") ? JSON.parse(url.searchParams.get("ssl")) : false,
  };
} catch (error) {
  console.error("Failed to parse DATABASE_URL:", error.message);
  process.exit(1);
}

const pool = mysql.createPool(connectionConfig);

// Image URLs from generated assets
const IMAGES = {
  nyama_choma: "https://d2xsxph8kpxj0f.cloudfront.net/310519663569063075/gqBHq9NcJacoJyRSympUqX/nyama_choma-79bnF2VH3bY2ge3iEHVyRt.webp",
  ugali_sukuma: "https://d2xsxph8kpxj0f.cloudfront.net/310519663569063075/gqBHq9NcJacoJyRSympUqX/ugali_sukuma-EvkLdB8XZxvKy7YDtWYtXy.webp",
  samosa: "https://d2xsxph8kpxj0f.cloudfront.net/310519663569063075/gqBHq9NcJacoJyRSympUqX/samosa_platter-FR6HzFXwjYThq8QgFBHmUb.webp",
  biryani: "https://d2xsxph8kpxj0f.cloudfront.net/310519663569063075/gqBHq9NcJacoJyRSympUqX/chicken_biryani-ibxrsLKxuQzCyhVNjYJjNn.webp",
  mandazi: "https://d2xsxph8kpxj0f.cloudfront.net/310519663569063075/gqBHq9NcJacoJyRSympUqX/mandazi-jMe33Y2rwAY494MGVNb56q.webp",
  githeri: "https://d2xsxph8kpxj0f.cloudfront.net/310519663569063075/gqBHq9NcJacoJyRSympUqX/githeri-agKQWhqMeQbkA8GSk8ivZF.webp",
  burger: "https://d2xsxph8kpxj0f.cloudfront.net/310519663569063075/gqBHq9NcJacoJyRSympUqX/burger_deluxe-6LbgiXLULjVp5vzoz69NeJ.webp",
  sushi: "https://d2xsxph8kpxj0f.cloudfront.net/310519663569063075/gqBHq9NcJacoJyRSympUqX/sushi_platter-aKaDwikVqLZLt5odKfYaLe.webp",
  pizza: "https://d2xsxph8kpxj0f.cloudfront.net/310519663569063075/gqBHq9NcJacoJyRSympUqX/pizza_margherita-Tjxq6Kur5LWjgNLNZtH2dq.webp",
  restaurant1: "https://d2xsxph8kpxj0f.cloudfront.net/310519663569063075/gqBHq9NcJacoJyRSympUqX/restaurant_storefront_1-aPUQnPuQrH8JxGoFizCv7P.webp",
  restaurant2: "https://d2xsxph8kpxj0f.cloudfront.net/310519663569063075/gqBHq9NcJacoJyRSympUqX/restaurant_storefront_2-Zb4Ltm8ByQbshuASvz7ckV.webp",
  restaurant3: "https://d2xsxph8kpxj0f.cloudfront.net/310519663569063075/gqBHq9NcJacoJyRSympUqX/restaurant_storefront_3-Y3ve44nhvCtUiaXW5uKNsT.webp",
};

// Realistic Kenyan market prices (in KES)
const RESTAURANTS = [
  {
    name: "Nyama Choma House",
    description: "Authentic grilled meats and traditional Kenyan cuisine",
    cuisine: "Kenyan",
    imageUrl: IMAGES.restaurant1,
    rating: 4.7,
    reviewCount: 245,
    deliveryTime: "25-35 min",
    deliveryFee: 150,
    minOrder: 500,
    isOpen: true,
    featured: true,
    address: "Westlands, Nairobi",
  },
  {
    name: "Samosa & Chai",
    description: "Traditional Indian-Kenyan fusion with fresh ingredients",
    cuisine: "Indian",
    imageUrl: IMAGES.restaurant2,
    rating: 4.5,
    reviewCount: 189,
    deliveryTime: "30-40 min",
    deliveryFee: 120,
    minOrder: 400,
    isOpen: true,
    featured: true,
    address: "Kilimani, Nairobi",
  },
  {
    name: "Burger Palace",
    description: "Gourmet burgers and premium fast food",
    cuisine: "American",
    imageUrl: IMAGES.restaurant3,
    rating: 4.6,
    reviewCount: 312,
    deliveryTime: "20-30 min",
    deliveryFee: 100,
    minOrder: 350,
    isOpen: true,
    featured: true,
    address: "Parklands, Nairobi",
  },
  {
    name: "Sushi Paradise",
    description: "Fresh sushi and Japanese delicacies",
    cuisine: "Japanese",
    imageUrl: IMAGES.restaurant1,
    rating: 4.8,
    reviewCount: 156,
    deliveryTime: "35-45 min",
    deliveryFee: 200,
    minOrder: 800,
    isOpen: true,
    featured: false,
    address: "Westlands, Nairobi",
  },
  {
    name: "Pizza Perfetto",
    description: "Wood-fired pizzas and Italian classics",
    cuisine: "Italian",
    imageUrl: IMAGES.restaurant2,
    rating: 4.4,
    reviewCount: 201,
    deliveryTime: "30-40 min",
    deliveryFee: 150,
    minOrder: 600,
    isOpen: true,
    featured: false,
    address: "Hurlingham, Nairobi",
  },
  {
    name: "Spice Garden",
    description: "Rich and aromatic Indian curries and tandoor specialties",
    cuisine: "Indian",
    imageUrl: IMAGES.restaurant3,
    rating: 4.7,
    reviewCount: 167,
    deliveryTime: "35-45 min",
    deliveryFee: 180,
    minOrder: 700,
    isOpen: true,
    featured: true,
    address: "Karen, Nairobi",
  },
  {
    name: "The Burger Lab",
    description: "Gourmet smash burgers with artisan buns and house-made sauces",
    cuisine: "American",
    imageUrl: IMAGES.restaurant1,
    rating: 4.7,
    reviewCount: 218,
    deliveryTime: "20-30 min",
    deliveryFee: 120,
    minOrder: 400,
    isOpen: true,
    featured: true,
    address: "Kilimani, Nairobi",
  },
  {
    name: "Sakura Sushi Bar",
    description: "Premium sushi and Japanese cuisine by master chefs",
    cuisine: "Japanese",
    imageUrl: IMAGES.restaurant2,
    rating: 4.9,
    reviewCount: 189,
    deliveryTime: "40-50 min",
    deliveryFee: 250,
    minOrder: 1000,
    isOpen: true,
    featured: true,
    address: "Westlands, Nairobi",
  },
  {
    name: "Napoli Pizza Co.",
    description: "Authentic Neapolitan pizza with imported Italian ingredients",
    cuisine: "Italian",
    imageUrl: IMAGES.restaurant3,
    rating: 4.8,
    reviewCount: 342,
    deliveryTime: "30-40 min",
    deliveryFee: 150,
    minOrder: 650,
    isOpen: true,
    featured: true,
    address: "Parklands, Nairobi",
  },
];

// Menu items with realistic Kenyan prices
const MENU_ITEMS = {
  "Nyama Choma House": [
    { name: "Grilled Beef Ribs (500g)", price: 850, category: "Main Course", description: "Tender grilled beef ribs with our signature spice blend" },
    { name: "Grilled Chicken (1/2)", price: 650, category: "Main Course", description: "Succulent half chicken grilled to perfection" },
    { name: "Ugali & Sukuma Wiki", price: 250, category: "Sides", description: "Traditional maize meal with sautéed greens" },
    { name: "Nyama Choma Platter", price: 1200, category: "Main Course", description: "Mix of beef, chicken, and goat meat" },
    { name: "Chapati", price: 80, category: "Bread", description: "Soft Indian-style flatbread" },
  ],
  "Samosa & Chai": [
    { name: "Samosa Platter (6pcs)", price: 180, category: "Appetizers", description: "Crispy samosas with tamarind chutney" },
    { name: "Chicken Biryani", price: 420, category: "Main Course", description: "Fragrant rice with tender chicken and spices" },
    { name: "Mandazi (3pcs)", price: 120, category: "Desserts", description: "Sweet fried dough pastries" },
    { name: "Masala Chai", price: 60, category: "Beverages", description: "Traditional spiced tea" },
    { name: "Githeri", price: 280, category: "Main Course", description: "Maize and beans stew" },
  ],
  "Burger Palace": [
    { name: "Classic Burger", price: 380, category: "Burgers", description: "Beef patty with lettuce, tomato, and special sauce" },
    { name: "Double Deluxe Burger", price: 580, category: "Burgers", description: "Two beef patties with cheese and bacon" },
    { name: "Chicken Burger", price: 320, category: "Burgers", description: "Crispy fried chicken breast burger" },
    { name: "French Fries", price: 150, category: "Sides", description: "Golden crispy fries" },
    { name: "Milkshake", price: 200, category: "Beverages", description: "Vanilla, chocolate, or strawberry" },
  ],
  "Sushi Paradise": [
    { name: "California Roll", price: 450, category: "Rolls", description: "Crab, avocado, and cucumber" },
    { name: "Salmon Nigiri (6pcs)", price: 580, category: "Nigiri", description: "Fresh salmon over rice" },
    { name: "Sushi Platter", price: 1200, category: "Platters", description: "Assorted sushi selection" },
    { name: "Miso Soup", price: 180, category: "Soups", description: "Traditional soybean soup" },
    { name: "Edamame", price: 220, category: "Appetizers", description: "Steamed soybeans with salt" },
  ],
  "Pizza Perfetto": [
    { name: "Margherita Pizza", price: 520, category: "Pizza", description: "Fresh mozzarella, tomato, and basil" },
    { name: "Pepperoni Pizza", price: 620, category: "Pizza", description: "Spicy pepperoni with mozzarella" },
    { name: "Quattro Formaggi", price: 750, category: "Pizza", description: "Four cheese blend" },
    { name: "Garlic Bread", price: 200, category: "Sides", description: "Crispy bread with garlic butter" },
    { name: "Tiramisu", price: 280, category: "Desserts", description: "Classic Italian dessert" },
  ],
  "Spice Garden": [
    { name: "Butter Chicken", price: 480, category: "Main Course", description: "Tender chicken in creamy tomato sauce" },
    { name: "Paneer Tikka Masala", price: 420, category: "Main Course", description: "Cottage cheese in aromatic sauce" },
    { name: "Lamb Biryani", price: 580, category: "Main Course", description: "Fragrant rice with tender lamb" },
    { name: "Naan Bread", price: 120, category: "Bread", description: "Tandoor-baked flatbread" },
    { name: "Raita", price: 100, category: "Sides", description: "Yogurt-based side dish" },
  ],
  "The Burger Lab": [
    { name: "Smash Burger Single", price: 420, category: "Burgers", description: "Crispy smashed beef patty" },
    { name: "Smash Burger Double", price: 620, category: "Burgers", description: "Two crispy smashed patties" },
    { name: "Truffle Fries", price: 280, category: "Sides", description: "Fries with truffle oil" },
    { name: "Onion Rings", price: 220, category: "Sides", description: "Crispy battered onion rings" },
    { name: "Burger Combo", price: 850, category: "Combos", description: "Burger, fries, and drink" },
  ],
  "Sakura Sushi Bar": [
    { name: "Premium Sushi Platter", price: 1800, category: "Platters", description: "Chef's selection of premium sushi" },
    { name: "Toro Nigiri (6pcs)", price: 980, category: "Nigiri", description: "Premium fatty tuna" },
    { name: "Dragon Roll", price: 720, category: "Rolls", description: "Eel, avocado, and cucumber" },
    { name: "Sake", price: 450, category: "Beverages", description: "Japanese rice wine" },
    { name: "Tempura Shrimp", price: 580, category: "Appetizers", description: "Crispy battered shrimp" },
  ],
  "Napoli Pizza Co.": [
    { name: "Neapolitan Margherita", price: 680, category: "Pizza", description: "Authentic Neapolitan with San Marzano tomatoes" },
    { name: "Prosciutto & Arugula", price: 780, category: "Pizza", description: "Italian ham with fresh greens" },
    { name: "Truffle Pizza", price: 950, category: "Pizza", description: "Truffle oil, mushrooms, and cheese" },
    { name: "Focaccia Bread", price: 250, category: "Bread", description: "Olive oil focaccia" },
    { name: "Panna Cotta", price: 320, category: "Desserts", description: "Italian cream dessert" },
  ],
};

async function seed() {
  const connection = await pool.getConnection();

  try {
    console.log("Starting database seed...");

    // Clear existing data
    await connection.query("DELETE FROM order_items");
    await connection.query("DELETE FROM orders");
    await connection.query("DELETE FROM menu_items");
    await connection.query("DELETE FROM menu_categories");
    await connection.query("DELETE FROM restaurants");

    console.log("Cleared existing data");

    // Insert restaurants
    for (const restaurant of RESTAURANTS) {
      const [result] = await connection.query(
        "INSERT INTO restaurants (name, description, cuisine, imageUrl, rating, reviewCount, deliveryTime, deliveryFee, minOrder, isOpen, featured, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          restaurant.name,
          restaurant.description,
          restaurant.cuisine,
          restaurant.imageUrl,
          restaurant.rating,
          restaurant.reviewCount,
          restaurant.deliveryTime,
          restaurant.deliveryFee,
          restaurant.minOrder,
          restaurant.isOpen ? 1 : 0,
          restaurant.featured ? 1 : 0,
          restaurant.address,
        ]
      );

      const restaurantId = result.insertId;
      console.log(`Inserted restaurant: ${restaurant.name} (ID: ${restaurantId})`);

      // Get menu items for this restaurant
      const items = MENU_ITEMS[restaurant.name] || [];

      // Get unique categories for this restaurant
      const categories = [...new Set(items.map((item) => item.category))];

      // Insert categories and menu items
      for (const category of categories) {
        const [categoryResult] = await connection.query(
          "INSERT INTO menu_categories (restaurantId, name) VALUES (?, ?)",
          [restaurantId, category]
        );

        const categoryId = categoryResult.insertId;

        // Insert menu items for this category
        const categoryItems = items.filter((item) => item.category === category);
        for (const item of categoryItems) {
          await connection.query(
            "INSERT INTO menu_items (restaurantId, categoryId, name, description, price) VALUES (?, ?, ?, ?, ?)",
            [restaurantId, categoryId, item.name, item.description, item.price]
          );
        }
      }
    }

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error.message);
    throw error;
  } finally {
    await connection.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
