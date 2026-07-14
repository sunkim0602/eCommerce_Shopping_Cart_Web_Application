import express from "express";
import { Op } from "sequelize";
import { Product } from "../models/Product.js";

export const apiProducts = express.Router();

// List all products
apiProducts.get("/", async (_req, res) => {
  const products = await Product.findAll({ order: [["id", "ASC"]] });
  res.json(products);
});

// Search products by text
apiProducts.get("/search", async (req, res) => {
  const term = (req.query.term || "").trim();
  if (!term) return res.json([]);

  const products = await Product.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.like]: `%${term}%` } },
        { description: { [Op.like]: `%${term}%` } }
      ]
    }
  });

  res.json(products);
});

// Filter products by price range
apiProducts.get("/price", async (req, res) => {
  const min = Number(req.query.min ?? 0);
  const max = Number(req.query.max ?? Number.MAX_SAFE_INTEGER);

  const products = await Product.findAll({
    where: { price: { [Op.between]: [min, max] } },
    order: [["price", "ASC"]]
  });

  res.json(products);
});

export default apiProducts;