import { gql } from "graphql-tag";
import { Op } from "sequelize";
import { Product } from "./models/Product.js";

export const typeDefs = gql`
  type Product {
    id: ID!
    name: String!
    description: String!
    price: Float!
    stockQty: Int!
  }

  type Query {
    products: [Product!]!
    productsByTerm(term: String!): [Product!]!
    productsByPrice(min: Float!, max: Float!): [Product!]!
    productsFiltered(term: String, min: Float, max: Float): [Product!]!
  }
`;

export const resolvers = {
  Query: {
    products: async () => Product.findAll({ order: [["id", "ASC"]] }),

    productsByTerm: async (_p, { term }) => {
      const t = (term ?? "").trim();
      if (!t) return [];
      return Product.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${t}%` } },
            { description: { [Op.like]: `%${t}%` } }
          ]
        },
      });
    },

    productsFiltered: async (_p, { term, min, max }) => {
      const where = {};

      const t = (term ?? "").trim();
      if (t) {
        where[Op.or] = [
          { name: { [Op.like]: `%${t}%` } },
          { description: { [Op.like]: `%${t}%` } }
        ];
      }

      if (min != null || max != null) {
        where.price = { [Op.between]: [min ?? 0, max ?? 999999] };
      }

      return Product.findAll({ where, order: [["id", "ASC"]] });
    }
  },        

  Product: {
    price: (p) => Number(p.price)
  }
};
