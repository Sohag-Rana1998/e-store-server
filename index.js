const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const port = process.env.PORT || 5000;

// middleware
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:5173"],
  })
);

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iulixph.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    const productsCollection = client.db("E-Store").collection("products");

    // app.get("/products", async (req, res) => {
    //   const result = await products.find().toArray();
    //   res.send(result);
    // });

    // all verified property by query

    app.get("/products", async (req, res) => {
      let {
        search,
        page,
        size,
        sortField,
        sortOrder,
        brand,
        category,
        minPrice,
        maxPrice,
      } = req.query;
      const limit = size;
      let query = {};
      // Search by product name
      if (search) {
        query.title = { $regex: search, $options: "i" }; // Case-insensitive search
      }

      // Filter by brand name
      if (brand) {
        query.brand = brand;
      }

      // Filter by category name
      if (category) {
        query.category = category;
      }

      // Filter by price range
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseFloat(minPrice);
        if (maxPrice) query.price.$lte = parseFloat(maxPrice);
      }

      let sort = {};
      if (sortOrder) {
        if (sortOrder === "asc") {
          sort.price = 1;
        } else if (sortOrder === "desc") {
          sort.price = -1;
        } else if (sortOrder === "DateDesc") {
          sort.date = -1;
        }
      }

      const skip = (page - 1) * limit;
      const products = await productsCollection
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();

      // Get the total number of products for pagination
      const totalProducts = await productsCollection.countDocuments(query);

      res.status(200).json({
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: parseInt(page),
        products,
      });
    });

    // Get  count for pagination
    // Get  count for pagination
    // app.get("/count-products", async (req, res) => {
    //   const search = req.query.search;
    //   const maxPrice = parseInt(req.query.maxPrice);
    //   const minPrice = parseInt(req.query.minPrice);
    //   let query = {};
    //   if (search)
    //     query = {
    //       title: { $regex: search, $options: "i" },
    //     };
    //   // Filter by price range
    //   if (minPrice || maxPrice) {
    //     query.price = {};
    //     if (minPrice) query.price.$gte = parseFloat(minPrice);
    //     if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    //   }

    //   const count = await products.countDocuments(query);
    //   console.log(count);
    //   res.send({ count });
    // });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Real state server is running");
});

app.listen(port, () => {
  console.log(`Real state server is running on port ${port}`);
});
