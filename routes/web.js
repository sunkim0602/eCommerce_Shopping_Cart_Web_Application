import express from "express";
import bcrypt from "bcrypt";
import passport from "../auth/passport.js";
import { ensureAuth, ensureAdmin } from "../auth/middleware.js";

import { User } from "../models/User.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { OrderItem } from "../models/OrderItem.js";
import { sequelize } from "../models/index.js";

export const web = express.Router();

// Home
web.get("/", (req, res) => res.render("home"));
  
// Authentication - show login page. An error message is shown if email or password is incorrect
web.get("/login", (req, res) => {
  const flash = req.session.flash;
  delete req.session.flash;

  const showError = req.query.err === "1";
  res.render("login", {
    flash,
    error: showError ? "Invalid email or password." : null
  });
  
});

//Handle login using passport to validate user login
web.post("/login",
  passport.authenticate("local", { failureRedirect: "/login?err=1" }),
  (req, res) => res.redirect("/products")
);

//registering a new user
web.get("/register", (req, res) => res.render("register"));
web.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) throw new Error("All fields required");
    const exists = await User.findOne({ where: { email } });
    if (exists) throw new Error("Email already registered");

    //create new user with login credentials
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ fullName, email, passwordHash, role: "customer" });
    res.redirect("/login");
  } catch (e) {
    res.status(400).render("register", { error: e.message });
  }
});

//Logout user
web.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/"));
});

web.get("/products", async (req, res) => {
  const raw = req.query.term;
  const term = (raw ?? "").trim();
  const termWasProvided = raw !== undefined;

  const minRaw = req.query.min;
  const maxRaw = req.query.max;

  const min = minRaw !== undefined && minRaw !== "" ? Number(minRaw) : null;
  const max = maxRaw !== undefined && maxRaw !== "" ? Number(maxRaw) : null;

  let products = [];

  //use GraphQL
  try {
  const query = `
    query ($term: String, $min: Float, $max: Float) {
      productsFiltered(term: $term, min: $min, max: $max) {
        id
        name
        description
        price
        stockQty
      }
    }
  `;

  const variables = {
    term: term || null,
    min,
    max
  };

  const data = await gqlRequest(query, variables);
  products = data.productsFiltered || [];

} catch (e) {
  console.error("GraphQL error:", e.message);
  products = [];
}
  
  //when term is provided and after trimming, it's still empty, trigger a message
  const emptySearchMessage =
    termWasProvided && term === ""
      ? { text: "Please enter a search term.", bg: "#fff3cd", color: "#664d03", dismiss: false }
      : null;

  //when a term is searched but query returns no products
  const searchMessage =
    (term || min !== null || max !== null) && products.length === 0
      ? { text: "No products found.", bg: "#fff3cd", color: "#664d03", dismiss: false }
      : null;

  //when an item gets added to cart
  const addedMessage =
    req.query.added === "1"
      ? { text: "Item added to cart!", bg: "#d1e7dd", color: "#0f5132", dismiss: true }
      : null;

  const message = emptySearchMessage ?? searchMessage ?? addedMessage;

  return res.render("products", {
    products,
    term,
    min: minRaw ?? "",
    max: maxRaw ?? "",
    message
  });
});

// Stores item into user's cart
function getCart(req) {
  if (!req.session.cart) req.session.cart = { items: [] };
  return req.session.cart;
}

// View user's cart
web.get("/cart", async (req, res) => {
  const cart = getCart(req);
  const productIds = cart.items.map(i => i.productId);
  const products = productIds.length ? await Product.findAll({ where: { id: productIds } }) : [];

  const cartItems = cart.items.map(i => {
    const p = products.find(x => x.id === i.productId);
    return p ? { name: p.name, price: p.price, quantity: i.quantity } : { name: "Unknown", price: 0, quantity: i.quantity };
  });

  res.render("cart", { cartItems, error: req.query.error, success: req.query.success });
});

//add item to cart
web.post("/cart/add", async (req, res) => {
  const productId = Number(req.body.productId);
  const quantity = Number(req.body.quantity);
  if (!productId || quantity <= 0) {
    return res.status(400).json({ success: false });
  }

  const cart = getCart(req);
  const existing = cart.items.find(i => i.productId === productId);
  if (existing) existing.quantity += quantity;
  else cart.items.push({ productId, quantity });

  const returnTo = req.body.returnTo || "/products";
  const sep = returnTo.includes("?") ? "&" : "?";
  return res.redirect(`${returnTo}${sep}added=1`);
});

//clear cart
web.post("/cart/clear", (req, res) => {
  req.session.cart = { items: [] };
  res.redirect("/cart?success=Cart cleared");
});

// Submit order / checkout
web.post("/cart/submit", ensureAuth, async (req, res) => {
  const cart = getCart(req);
  if (!cart.items.length) return res.redirect("/cart?error=Cart is empty");

  try {
    await sequelize.transaction(async (t) => {
      const productIds = cart.items.map(i => i.productId);
      const products = await Product.findAll({ where: { id: productIds }, transaction: t });

      for (const it of cart.items) {
        const p = products.find(x => x.id === it.productId);
        if (!p) throw new Error(`Product ${it.productId} not found`);
        if (p.stockQty < it.quantity) throw new Error(`Insufficient stock for ${p.name}`);
      }

      const order = await Order.create({ UserId: req.user.id }, { transaction: t });

      for (const it of cart.items) {
        const p = products.find(x => x.id === it.productId);
        await OrderItem.create(
          { OrderId: order.id, ProductId: p.id, quantity: it.quantity, unitPrice: p.price },
          { transaction: t }
        );
        p.stockQty -= it.quantity;
        await p.save({ transaction: t });
      }
    });

    //clears cart after order is placed successfully
    req.session.cart = { items: [] };
    res.redirect("/cart?success=Order submitted!");
  } catch (e) {
    res.redirect(`/cart?error=${encodeURIComponent(e.message)}`);
  }
});

// Show user's orders
web.get("/orders", ensureAuth, async (req, res) => {
  const orders = await Order.findAll({
    where: { UserId: req.user.id },
    include: [{ model: OrderItem, include: [Product] }],
    order: [["id", "DESC"]]
  });
  res.render("orders", {
    orders: orders.map(o => o.toJSON())
  });
});


// list products (admin view)
web.get("/admin/products", ensureAdmin, async (_req, res) => {
  const products = await Product.findAll({ order: [["id", "ASC"]] });
  res.render("admin/products", { products: products.map(p => p.toJSON()) });
});

//create products
web.post("/admin/products", ensureAdmin, async (req, res) => {
  const { name, description, price, stockQty } = req.body;
  await Product.create({ name, description, price, stockQty });
  res.redirect("/admin/products");
});

//update products
web.post("/admin/products/:id/update", ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { name, description, price, stockQty } = req.body;

  // Basic validation
  if (!name || !description || !price || !stockQty) {
    return res.status(400).send("All fields are required.");
  }

  // Additional validation
  if (price <= 0 || stockQty < 0) {
    return res.status(400).send("Invalid price or stock quantity.");
  }

  await Product.update(
    { name, description, price, stockQty },
    { where: { id } }
  );

  res.redirect("/admin/products");
});

//delete products
web.post("/admin/products/:id/delete", ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await Product.destroy({ where: { id } });
  res.redirect("/admin/products");
});

// Admin: customers list
web.get("/admin/customers", ensureAdmin, async (_req, res) => {
  const customers = await User.findAll({ order: [["id", "ASC"]] });
  res.render("admin/customers", { customers: customers.map(c => c.toJSON()) });
});

// Admin: customer orders
web.get("/admin/customers/:id/orders", ensureAdmin, async (req, res) => {
  const userId = Number(req.params.id);
  const customer = await User.findByPk(userId);
  const orders = await Order.findAll({
    where: { UserId: userId },
    include: [{ model: OrderItem, include: [Product] }],
    order: [["id", "DESC"]]
  });
  res.render("admin/customerOrders", {
    customer: customer?.toJSON(),
    orders: orders.map(o => o.toJSON())
  });
});

// Admin: delete order
web.post("/admin/orders/:id/delete", ensureAdmin, async (req, res) => {
  const orderId = Number(req.params.id);
  const order = await Order.findByPk(orderId);
  if (!order) return res.redirect("/admin/customers");

  await OrderItem.destroy({ where: { OrderId: orderId } });
  await Order.destroy({ where: { id: orderId } });

  res.redirect(`/admin/customers/${order.UserId}/orders`);
});

// Admin: update order status
web.post("/admin/orders/:id/status", ensureAdmin, async (req, res) => {
  const orderId = Number(req.params.id);
  const { status } = req.body;
  const order = await Order.findByPk(orderId);
  if (!order) return res.redirect("/admin/customers");

  await Order.update({ status }, { where: { id: orderId } });
  res.redirect(`/admin/customers/${order.UserId}/orders`);
});

//call GraphQL endpoint
async function gqlRequest(query, variables) {
  const resp = await fetch("http://localhost:3000/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables })
  });

  const json = await resp.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
}


export default web;