const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;

// middlewares

app.use(cors());
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ygezfuj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const featuredCollection = client.db("TechDb").collection("featured");
    const trendingCollection = client.db("TechDb").collection("trending");

    // featured products related api
    app.get('/featured', async(req, res) =>{
        const result = await featuredCollection.find().toArray()
        res.send(result)
    });

    // trending products related api
    app.get('/trending', async(req, res) =>{
        const result = await trendingCollection.find().toArray()
        res.send(result)
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) =>{
    res.send('flow tech is running')
});

app.listen(port, () =>{
    console.log(`flow tech is running on port ${port}`)
})