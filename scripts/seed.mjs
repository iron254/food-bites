import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// ── Restaurants ───────────────────────────────────────────────────────────────

const restaurantData = [
  {
    name: "Napoli Pizza Co.",
    description: "Authentic Neapolitan pizza baked in a wood-fired oven, using imported Italian ingredients.",
    cuisine: "Pizza",
    rating: "4.8",
    reviewCount: 342,
    deliveryTime: "25-35 min",
    deliveryFee: "260",
    minOrder: "1560.00",
    isOpen: true,
    featured: true,
    address: "123 Main Street, Downtown",
  },
  {
    name: "The Burger Lab",
    description: "Gourmet smash burgers crafted with premium beef, artisan buns, and house-made sauces.",
    cuisine: "Burgers",
    rating: "4.7",
    reviewCount: 218,
    deliveryTime: "20-30 min",
    deliveryFee: "325",
    minOrder: "1300.00",
    isOpen: true,
    featured: true,
    address: "456 Oak Avenue, Midtown",
  },
  {
    name: "Sakura Sushi Bar",
    description: "Premium sushi and Japanese cuisine prepared by master chefs with the freshest ingredients.",
    cuisine: "Sushi",
    rating: "4.9",
    reviewCount: 189,
    deliveryTime: "35-45 min",
    deliveryFee: "520",
    minOrder: "2600.00",
    isOpen: true,
    featured: true,
    address: "789 Cherry Lane, Eastside",
  },
  {
    name: "Bella Italia",
    description: "Classic Italian trattoria serving homemade pasta, risotto, and traditional family recipes.",
    cuisine: "Italian",
    rating: "4.6",
    reviewCount: 156,
    deliveryTime: "30-40 min",
    deliveryFee: "390",
    minOrder: "1950.00",
    isOpen: true,
    featured: false,
    address: "321 Vine Street, Westside",
  },
  {
    name: "Dragon Palace",
    description: "Authentic Chinese cuisine with a modern twist, featuring dim sum, noodles, and wok dishes.",
    cuisine: "Chinese",
    rating: "4.5",
    reviewCount: 203,
    deliveryTime: "25-35 min",
    deliveryFee: "260",
    minOrder: "1560.00",
    isOpen: true,
    featured: false,
    address: "654 Bamboo Road, Chinatown",
  },
  {
    name: "Spice Garden",
    description: "Rich and aromatic Indian curries, biryanis, and tandoor specialties from across India.",
    cuisine: "Indian",
    rating: "4.7",
    reviewCount: 167,
    deliveryTime: "30-45 min",
    deliveryFee: "325",
    minOrder: "1950.00",
    isOpen: true,
    featured: true,
    address: "987 Curry Lane, Northside",
  },
  {
    name: "El Taco Loco",
    description: "Vibrant Mexican street food with handmade tortillas, slow-cooked meats, and fresh salsas.",
    cuisine: "Mexican",
    rating: "4.4",
    reviewCount: 134,
    deliveryTime: "20-30 min",
    deliveryFee: "195",
    minOrder: "1300.00",
    isOpen: true,
    featured: false,
    address: "147 Fiesta Blvd, Southside",
  },
  {
    name: "Thai Orchid",
    description: "Fragrant Thai dishes bursting with lemongrass, coconut, and fresh herbs.",
    cuisine: "Thai",
    rating: "4.6",
    reviewCount: 98,
    deliveryTime: "30-40 min",
    deliveryFee: "390",
    minOrder: "1950.00",
    isOpen: false,
    featured: false,
    address: "258 Lotus Street, Eastside",
  },
];

// Insert restaurants
const insertedRestaurants = [];
for (const r of restaurantData) {
  const [result] = await connection.execute(
    `INSERT INTO restaurants (name, description, cuisine, rating, reviewCount, deliveryTime, deliveryFee, minOrder, isOpen, featured, address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [r.name, r.description, r.cuisine, r.rating, r.reviewCount, r.deliveryTime, r.deliveryFee, r.minOrder, r.isOpen ? 1 : 0, r.featured ? 1 : 0, r.address]
  );
  insertedRestaurants.push({ id: result.insertId, ...r });
  console.log(`✓ Restaurant: ${r.name} (id: ${result.insertId})`);
}

// ── Menu Categories & Items ───────────────────────────────────────────────────

const menuData = {
  "Napoli Pizza Co.": {
    categories: ["Starters", "Pizzas", "Pasta", "Desserts", "Drinks"],
    items: [
      { cat: "Starters", name: "Bruschetta al Pomodoro", desc: "Toasted bread with fresh tomatoes, basil, and extra virgin olive oil", price: "1170", isPopular: false },
      { cat: "Starters", name: "Arancini", desc: "Crispy risotto balls stuffed with mozzarella and ragù", price: "1300", isPopular: true },
      { cat: "Pizzas", name: "Margherita", desc: "San Marzano tomato, fresh mozzarella, basil, extra virgin olive oil", price: "1950", isPopular: true },
      { cat: "Pizzas", name: "Diavola", desc: "Spicy salami, mozzarella, chilli flakes, tomato sauce", price: "2210", isPopular: true },
      { cat: "Pizzas", name: "Quattro Formaggi", desc: "Mozzarella, gorgonzola, parmesan, and taleggio", price: "2340", isPopular: false },
      { cat: "Pizzas", name: "Prosciutto e Funghi", desc: "Prosciutto cotto, mushrooms, mozzarella, tomato sauce", price: "2470", isPopular: false },
      { cat: "Pasta", name: "Spaghetti Carbonara", desc: "Guanciale, egg yolk, pecorino romano, black pepper", price: "2080", isPopular: true },
      { cat: "Pasta", name: "Penne all'Arrabbiata", desc: "Spicy tomato sauce, garlic, chilli, fresh basil", price: "1820", isPopular: false },
      { cat: "Desserts", name: "Tiramisu", desc: "Classic Italian dessert with mascarpone and espresso-soaked ladyfingers", price: "1040", isPopular: true },
      { cat: "Drinks", name: "San Pellegrino", desc: "Sparkling mineral water 500ml", price: "455", isPopular: false },
    ],
  },
  "The Burger Lab": {
    categories: ["Burgers", "Sides", "Shakes & Drinks"],
    items: [
      { cat: "Burgers", name: "Classic Smash Burger", desc: "Double smash patty, American cheese, pickles, onion, special sauce", price: "1690", isPopular: true },
      { cat: "Burgers", name: "BBQ Bacon Burger", desc: "Smash patty, crispy bacon, cheddar, BBQ sauce, caramelised onions", price: "1950", isPopular: true },
      { cat: "Burgers", name: "Mushroom Swiss Burger", desc: "Smash patty, sautéed mushrooms, Swiss cheese, truffle mayo", price: "2080", isPopular: false },
      { cat: "Burgers", name: "Spicy Jalapeño Burger", desc: "Smash patty, pepper jack, jalapeños, chipotle sauce, lettuce", price: "1820", isPopular: true },
      { cat: "Burgers", name: "Veggie Burger", desc: "Black bean patty, avocado, tomato, lettuce, vegan mayo", price: "1690", isPopular: false },
      { cat: "Sides", name: "Crispy Fries", desc: "Golden fries seasoned with sea salt and rosemary", price: "650", isPopular: true },
      { cat: "Sides", name: "Onion Rings", desc: "Beer-battered onion rings with ranch dipping sauce", price: "780", isPopular: false },
      { cat: "Sides", name: "Coleslaw", desc: "Creamy house-made coleslaw", price: "455", isPopular: false },
      { cat: "Shakes & Drinks", name: "Classic Milkshake", desc: "Vanilla, chocolate, or strawberry — thick and creamy", price: "910", isPopular: true },
      { cat: "Shakes & Drinks", name: "Craft Lemonade", desc: "Freshly squeezed lemonade with mint", price: "520", isPopular: false },
    ],
  },
  "Sakura Sushi Bar": {
    categories: ["Starters", "Nigiri & Sashimi", "Maki Rolls", "Hot Dishes", "Desserts"],
    items: [
      { cat: "Starters", name: "Edamame", desc: "Steamed salted soybeans", price: "780", isPopular: false },
      { cat: "Starters", name: "Miso Soup", desc: "Traditional dashi broth with tofu, wakame, and spring onion", price: "650", isPopular: true },
      { cat: "Starters", name: "Gyoza (6 pcs)", desc: "Pan-fried pork and cabbage dumplings with ponzu sauce", price: "1170", isPopular: true },
      { cat: "Nigiri & Sashimi", name: "Salmon Nigiri (2 pcs)", desc: "Premium Atlantic salmon over seasoned sushi rice", price: "1040", isPopular: true },
      { cat: "Nigiri & Sashimi", name: "Tuna Sashimi (5 pcs)", desc: "Bluefin tuna sliced to perfection", price: "1950", isPopular: true },
      { cat: "Maki Rolls", name: "Dragon Roll (8 pcs)", desc: "Shrimp tempura, avocado, cucumber, topped with avocado and eel sauce", price: "2210", isPopular: true },
      { cat: "Maki Rolls", name: "Spicy Tuna Roll (8 pcs)", desc: "Tuna, spicy mayo, cucumber, sesame seeds", price: "1820", isPopular: true },
      { cat: "Maki Rolls", name: "California Roll (8 pcs)", desc: "Crab, avocado, cucumber, tobiko", price: "1560", isPopular: false },
      { cat: "Hot Dishes", name: "Chicken Teriyaki", desc: "Grilled chicken glazed with teriyaki sauce, served with steamed rice", price: "2340", isPopular: false },
      { cat: "Desserts", name: "Mochi Ice Cream (3 pcs)", desc: "Strawberry, mango, and matcha mochi ice cream", price: "1040", isPopular: true },
    ],
  },
  "Spice Garden": {
    categories: ["Starters", "Curries", "Biryanis", "Breads", "Desserts"],
    items: [
      { cat: "Starters", name: "Samosa (2 pcs)", desc: "Crispy pastry filled with spiced potatoes and peas", price: "910", isPopular: true },
      { cat: "Starters", name: "Chicken Tikka", desc: "Tender chicken marinated in yoghurt and spices, grilled in tandoor", price: "1690", isPopular: true },
      { cat: "Curries", name: "Butter Chicken", desc: "Tender chicken in a rich, creamy tomato-based sauce", price: "2210", isPopular: true },
      { cat: "Curries", name: "Lamb Rogan Josh", desc: "Slow-cooked lamb in aromatic Kashmiri spices", price: "2470", isPopular: false },
      { cat: "Curries", name: "Palak Paneer", desc: "Fresh cottage cheese in a velvety spinach gravy", price: "1950", isPopular: true },
      { cat: "Biryanis", name: "Chicken Biryani", desc: "Fragrant basmati rice layered with spiced chicken, saffron, and fried onions", price: "2340", isPopular: true },
      { cat: "Biryanis", name: "Vegetable Biryani", desc: "Aromatic basmati rice with seasonal vegetables and whole spices", price: "1950", isPopular: false },
      { cat: "Breads", name: "Garlic Naan", desc: "Soft leavened bread with garlic and butter, baked in tandoor", price: "520", isPopular: true },
      { cat: "Breads", name: "Paratha", desc: "Flaky whole wheat flatbread", price: "390", isPopular: false },
      { cat: "Desserts", name: "Gulab Jamun", desc: "Soft milk-solid dumplings soaked in rose-flavoured syrup", price: "780", isPopular: true },
    ],
  },
};

for (const [restaurantName, data] of Object.entries(menuData)) {
  const restaurant = insertedRestaurants.find((r) => r.name === restaurantName);
  if (!restaurant) continue;

  // Insert categories
  const categoryIds = {};
  for (let i = 0; i < data.categories.length; i++) {
    const [result] = await connection.execute(
      `INSERT INTO menu_categories (restaurantId, name, sortOrder) VALUES (?, ?, ?)`,
      [restaurant.id, data.categories[i], i]
    );
    categoryIds[data.categories[i]] = result.insertId;
  }

  // Insert items
  for (const item of data.items) {
    const catId = categoryIds[item.cat] ?? null;
    await connection.execute(
      `INSERT INTO menu_items (restaurantId, categoryId, name, description, price, isAvailable, isPopular)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [restaurant.id, catId, item.name, item.desc, item.price, item.isPopular ? 1 : 0]
    );
  }
  console.log(`✓ Menu for: ${restaurantName} (${data.items.length} items)`);
}

await connection.end();
console.log("\n✅ Seed complete with Kenyan Shillings!");
