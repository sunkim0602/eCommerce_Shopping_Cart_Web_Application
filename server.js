import express from "express";
import session from "express-session";
import { engine } from "express-handlebars";
import path from "node:path";
import passport from "./auth/passport.js";
import { sequelize } from "./models/index.js";
import apiProducts from "./routes/api.products.js";
import apiOrders from "./routes/api.orders.js";
import webRoutes from "./routes/web.js";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import connectSessionSequelize from "connect-session-sequelize";
import { typeDefs, resolvers } from "./graphql.js";
import authWebRoutes from "./routes/registration.js"




const app = express();

app.use(express.static(path.join(process.cwd(), "public")));

// Handlebars
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(process.cwd(), "views"));

// Parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Sessions (stored in SQLite via Sequelize)
const SequelizeStore = connectSessionSequelize(session.Store);
const sessionStore = new SequelizeStore({ db: sequelize });

app.use(
  session({
    secret: "dev_secret_change_me",
    resave: false,
    saveUninitialized: false,
    store: sessionStore
  })
);

sessionStore.sync();

app.use(passport.initialize());
app.use(passport.session());

//registration
app.use(authWebRoutes);

// Make user available to views
app.use((req, res, next) => {
  const safeUser = req.user?.toJSON ? req.user.toJSON() : req.user;

  res.locals.user = safeUser || null;
  res.locals.userIsAdmin = safeUser?.role === "admin";

  next();
});

// REST APIs 
app.use("/api/products", apiProducts);
app.use("/api/orders", apiOrders);

// GraphQL
const gqlServer = new ApolloServer({ typeDefs, resolvers });
await gqlServer.start();
app.use("/graphql", expressMiddleware(gqlServer));

// Web UI
app.use("/", webRoutes);

// Start
await sequelize.sync();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));


