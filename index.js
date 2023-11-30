const express = require('express');
const app = express();
var jwt = require('jsonwebtoken')
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;

// middlewares

app.use(cors());
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    // await client.connect();

    const featuredCollection = client.db("TechDb").collection("featured");
    const trendingCollection = client.db("TechDb").collection("trending");
    const productCollection = client.db("TechDb").collection("products");
    const reviewCollection = client.db("TechDb").collection("reviews");
    const userCollection = client.db("TechDb").collection("users");
    const itemCollection = client.db("TechDb").collection("myItems");

    // middlewares

    const verifyToken = (req, res, next) => {
        console.log('inside verify token', req.headers.authorization);
        if (!req.headers.authorization) {
            return res.status(401).send({ message: "unauthorized access" })
        }
        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).send({ message: "unauthorized access" })
            }
            req.decoded = decoded;
            next();
        });
    }

    const verifyAdmin = async (req, res, next) => {
        const email = req.decoded.email;
        const query = { email: email };
        const user = await userCollection.findOne(query);
        const isAdmin = user?.role === 'admin';
        if (!isAdmin) {
            return res.status(403).send({ message: 'forbidden access' });
        }
        next();
    }


    const verifyModerator = async (req, res, next) => {
        const email = req.decoded.email;
        const query = { email: email };
        const user = await userCollection.findOne(query);
        const isModerator = user?.role === 'moderator';
        if (!isModerator) {
            return res.status(403).send({ message: 'forbidden access' });
        }
        next();
    }

    // jwt related api
    app.post('/jwt', async(req, res) =>{
        const user = req.body
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1hr'})
        res.send({token})
    })

    app.post('/myItems', verifyToken, async (req, res) =>{
        const query = req.body;
        console.log(query);
        const result = await itemCollection.insertOne(query);
        res.send(result)
    });

    app.delete('/myItems/:id', verifyToken, async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await itemCollection.deleteOne(query);
        res.send(result)
    });

    app.get('/myItems/:id', verifyToken, async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await itemCollection.findOne(query);
        res.send(result)
    });

    app.get('/myItems', async(req, res) =>{
        const result = await itemCollection.find().toArray()
        res.send(result)
    });

    // featured products related api
    app.get('/featured', async(req, res) =>{
        const result = await featuredCollection.find().toArray()
        res.send(result)
    });
    

    app.get('/featured/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await featuredCollection.findOne(query);
        res.send(result);
      })

    // trending products related api
    app.get('/trending', async(req, res) =>{
        const result = await trendingCollection.find().toArray()
        res.send(result)
    });

    // all products related api
    app.get('/products', async(req, res) =>{
        // const filter = req.query.search
        // console.log(filter)
        // const query = {
        //     tags:{ $regex: filter, $options: 'i'}
        // }
        const cursor = productCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    });

    

    app.get('/products/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await productCollection.findOne(query);
        res.send(result);
      })

    //   review

    app.post('/reviews', async (req, res) =>{
        const reviews = req.body;
        console.log(reviews);
        const result = await reviewCollection.insertOne(reviews);
        res.send(result)
    })

    app.get('/reviews', async(req, res) =>{
        const result = await reviewCollection.find().toArray()
        res.send(result)
    });

    // user

    app.get('/users', verifyToken, verifyAdmin, async(req, res) =>{
        console.log(req.headers);
        const result = await userCollection.find().toArray()
        res.send(result)
    });

    // admin
    app.get('/users/admin/admin/:email', verifyToken,  async (req, res) => {
        const email = req.params.email;

        if (email !== req.decoded.email) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        const query = { email: email };
        const user = await userCollection.findOne(query);
        let admin = false;
        if (user) {
            admin = user?.role === 'admin';
        }
        res.send({ admin });
    });

    
    app.patch('/users/admin/admin/:id',verifyToken, async(req, res) =>{
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const updateDoc = {
            $set: {
                role: "admin"
            },
        };
        const result = await userCollection.updateOne(query, updateDoc);
        res.send(result)
    })

    // moderator
    app.get('/users/moderator/:email', verifyToken,  async (req, res) => {
        const email = req.params.email;

        if (email !== req.decoded.email) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        const query = { email: email };
        const user = await userCollection.findOne(query);
        let moderator = false;
        if (user) {
            moderator = user?.role === 'moderator';
        }
        res.send({ moderator });
    });

    app.patch('/users/moderator/:id',verifyToken, async(req, res) =>{
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const updateDoc = {
            $set: {
                role: "moderator"
            },
        };
        const result = await userCollection.updateOne(query, updateDoc);
        res.send(result)
    })


    app.post('/users', async (req, res) =>{
        const user = req.body;
        const query = {email: user.email}
        const existingUser = await userCollection.findOne(query);
        if(existingUser){
            return res.send({
                message: 'user already exists', insertedId: null
            })
        }
       
        const result = await userCollection.insertOne(user);
        res.send(result)
    })

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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