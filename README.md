SK Electronics - Shopping Cart Web Application
CS602 - Term Project, Sun Kim

Project Description:
SK Electronics is a server-side shopping cart web application developed using Node.js and Express. The application simulates an online electronics store where customers can browse products, search/filter items, add items to a cart, and submit orders.
The system also includes an administrative interface that allows management of products and customer orders.

Instructions - How to Initialize the Database:
The project includes a seed script that creates: 1 admin user, 1 customer user, sample products
1. Run: ‘node seed.js’  - recreate the SQLite database and insert sample data
2. Database file created - shopping.sqlite

Instructions - How to Run the Application
1. Run: ‘npm install’ - install dependencies
2. Run: ‘npm start’ - start server
3. Open ‘http://localhost:3000’

Term Project Requirements - Implementation Mapping & Tech Stack
	•	NodeJS-centric using ExpressJS - the application is implemented using Node.js with the Express framework as the core server
	⁃	main server initialization in server.js
	⁃	Express routing in routes/
	⁃	Middleware and session handling implemented server-side
	•	Server-side
	⁃	Product search/filter handled in Express routes
	⁃	Cart stored in session
	⁃	Order validation and stock checking
	⁃	Database queries
	⁃	Views rendered via Handlebars
	•	Persistence of Data (Sequelize & SQLite)
	⁃	Database connection: db/index.js
	⁃	Models: models/
	⁃	SQLite file: shopping.sqlite
	•	REST API Endpoints
	⁃	GET /api/products
	⁃	GET /api/products/search?term=usb
	⁃	GET /api/products/price?min=10&max=50
	•	GraphQL Endpoints - implemented using Apollo Server
	⁃	schema - graphql/schema.js
	⁃	resolvers - graphql/graphql.js
	•	PassportJS Authentication/Authorization
	⁃	auth/passport.js
	⁃	auth/middleware.js
	•	Handlebars Front-End View Pages
	⁃	views/products.handlebars
	⁃	views/cart.handlebars
	⁃	views/orders.handlebars
	⁃	views/admin/*.handlebars

Features
Customer Interface:
	⁃	Registers customer account
	⁃	Login/logout - authentication
	⁃	View product list
	⁃	Search products by keyword
	⁃	Filter products by price range
	⁃	Specify quantity and add items to cart
	⁃	Submit orders
	⁃	View their order history

Admin Interface:
	⁃	Add products
	⁃	Update products
	⁃	Delete products
	⁃	View all customers
	⁃	View orders per customer
	⁃	Update order status
	⁃	Delete orders

Test Users
Admin:
Email - admin@shop.com
Password - admin123
*When creating a new admin login profile, use ‘cs602admin’ for the admin code
Customer:
Email - customer@shop.com
Password - customer123

Dependencies
This project uses the following main libraries:
	•	Express — web server framework
	•	Sequelize + SQLite — relational database persistence
	•	PassportJS — authentication and authorization
	•	Apollo Server (GraphQL) — GraphQL API
	•	Express-Handlebars — server-side views








