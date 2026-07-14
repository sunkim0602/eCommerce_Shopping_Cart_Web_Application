import bcrypt from "bcrypt";
import { sequelize } from "./models/index.js";
import { User } from "./models/User.js";
import { Product } from "./models/Product.js";

async function seed() {
  await sequelize.sync({ force: true });

  const adminPass = await bcrypt.hash("admin123", 10);
  const custPass = await bcrypt.hash("customer123", 10);

  await User.bulkCreate([
    { fullName: "Admin User", email: "admin@shop.com", passwordHash: adminPass, role: "admin" },
    { fullName: "Customer User", email: "customer@shop.com", passwordHash: custPass, role: "customer" }
  ]);

  await Product.bulkCreate([
    { name: "Wireless Mouse", description: "Ergonomic wireless mouse", price: 24.99, stockQty: 20 },
    { name: "Mechanical Keyboard", description: "Blue switches, compact layout", price: 69.99, stockQty: 10 },
    { name: "USB-C Cable", description: "1m braided cable", price: 9.99, stockQty: 50 },
    { name: "Laptop Stand", description: "Aluminum adjustable stand", price: 34.99, stockQty: 8 }
  ]);

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});