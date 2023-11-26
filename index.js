const express = require('express');
const cors = require('cors')
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors())
app.use(express.json())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.udflnrf.mongodb.net/?retryWrites=true&w=majority`;

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



        const usersCollection = client.db("ExpressCargo").collection("users")
        const bookingsCollection = client.db("ExpressCargo").collection("bookings")


        // check isAdmin 

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            let isAdmin = false;
            if (user) {
                isAdmin = user?.role === 'admin'
            }
            res.send({ isAdmin })
        })

        // check isDeliverer

        app.get('/users/deliverer/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            let isDeliverer = false;
            if (user) {
                isDeliverer = user?.role === "deliverer"
            }
            res.send({ isDeliverer })
        })



        app.post('/users', async (req, res) => {
            const userData = req.body;
            const query = { email: userData.email }
            const isExist = await usersCollection.findOne(query)
            if (isExist) {
                return res.send({ massage: "user is already exist" })
            }
            const result = await usersCollection.insertOne(userData)
            res.send(result)
        })


        // save product in bookings collection 

        app.post('/bookings', async (req, res) => {
            const product = req.body
            const result = await bookingsCollection.insertOne(product)
            res.send(result)
        })







        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Express cargo server is running !!!')
})

app.all('*', (req, res, next) => {
    const error = new Error(`the requested url is invalid : [${req.url}]`)
    error.status = 404;
    next(error)
})


app.use((err, req, res, next) => {
    res.status(err.status || 500).json({

        massage: `the requested url is invalid : [${req.url}]`,
        status: err.status

    })
})


const main = async () => {
    await run()
    app.listen(port, () => {
        console.log(`Express Cargo server is running on port : ${port}`)
    })
}

main();
