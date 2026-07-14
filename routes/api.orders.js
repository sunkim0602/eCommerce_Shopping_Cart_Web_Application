import express from "express";
import { sequelize } from "../models/index.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { OrderItem } from "../models/OrderItem.js";

export const apiOrders = express.Router();

apiOrders.post("/", async (req, res) => {
  const { userId, items } = req.body || {};
  if (!userId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "userId and items[] required" });
  }

  try {
    const result = await sequelize.transaction(async (t) => {

      const productIds = items.map(i => i.productId);
      const products = await Product.findAll({ where: { id: productIds }, transaction: t });

      // Validate all items exist and have enough stock
      for (const it of items) {
        const p = products.find(x => x.id === it.productId);
        if (!p) throw new Error(`Product ${it.productId} not found`);
        if (it.quantity <= 0) throw new Error(`Quantity must be > 0 for product ${it.productId}`);
        if (p.stockQty < it.quantity) throw new Error(`Insufficient stock for ${p.name}`);
      }

      const order = await Order.create({ UserId: userId }, { transaction: t });

      // Create items + decrement stock
      for (const it of items) {
        const p = products.find(x => x.id === it.productId);
        await OrderItem.create(
          { OrderId: order.id, ProductId: p.id, quantity: it.quantity, unitPrice: p.price },
          { transaction: t }
        );

        p.stockQty -= it.quantity;
        await p.save({ transaction: t });
      }

      return order;
    });

    return res.status(201).json({ orderId: result.id });
  } catch (e) {
    return res.status(400).json({ error: e.message || "Order failed" });
  }
});

apiOrders.get("/user/:userId", async (req, res) => {
  const userId = Number(req.params.userId);
  const orders = await Order.findAll({
    where: { UserId: userId },
    include: [{ model: OrderItem, include: [Product] }],
    order: [["id", "DESC"]]
  });
  res.json(orders);
});

export default apiOrders;