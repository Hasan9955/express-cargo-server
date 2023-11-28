const express = require('express');
const cors = require('cors')
const jwt = require('jsonwebtoken')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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




        // ______________OUR OWN MEDDLERS_______________
        const verifyToken = (req, res, next) =>{
            if(!req.headers.authorization){
                return res.status(401).send({massage: 'unauthorized access'})
            }
            const token = req.headers.authorization.split(' ')[1]
            jwt.verify(token, process.env.API_SECRET_KEY, (error, decoded) =>{
                if(error){
                    return res.status(401).send({ massage: 'unauthorized access' })
                }
                req.decoded = decoded;
                next()
            })
        }


        const verifyAdmin = async (req, res, next) =>{
            const email = req.decoded.email; 
            const query = {email: email}
            const user = await usersCollection.findOne(query) 
            const isAdmin = user?.role === 'admin'   
            if(!isAdmin){
                return res.status(401).send({massage: 'unauthorized access'})
            }
            next()
        }






         // _____________JWT API_______________
         app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.API_SECRET_KEY, { expiresIn: '1h' })
            res.send({token})
        })

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

       

        // ____________USER RELATED API_____________


        
        

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


        // __________________ADMIN API________________


        app.get('/users', verifyToken, verifyAdmin, async (req, res) =>{
            const result = await usersCollection.find().toArray();
            res.send(result)
        })

        app.get('/users/isDeliverer', verifyToken, verifyAdmin, async (req, res) =>{
            const query = {role: 'deliverer'}
            const result = await usersCollection.find(query).toArray();
            res.send(result)

        })


        // only for admin for change a user role
        app.put('/users/:id', verifyToken, verifyAdmin, async(req, res) =>{
            const id = req.params.id;
            const user = req.body;
            const filter = {_id: new ObjectId(id)}
            const upDoc = {
                $set: {
                    role: user.role
                }
            }
            const result = await usersCollection.updateOne(filter, upDoc)
            res.send(result)
        })


        // only for admin to delete a user from database
        app.delete('/users/:id', verifyToken, verifyAdmin, async(req, res) =>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await usersCollection.deleteOne(query)
            res.send(result)
        })


        // _____________ BOOKINGS API _______________
        // save product in bookings collection 

        app.get('/bookings', verifyToken, async (req, res) => {
            const email = req.query.email; 
            if(req.decoded.email !== email){
                return res.status(403).send({massage: "Forbidden Access"})
            }

            const query = { email: email }
            const result = await bookingsCollection.find(query).toArray()
            res.send(result)
        })


        // get total bookings by specific users only for admin

        app.get('/totalBookings', verifyToken, async (req, res) => {
            const email = req.query.email; 
            const query = { email: email }
            const result = await bookingsCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/updateParcel/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingsCollection.findOne(query)
            res.send(result)
        })


        app.post('/bookings', async (req, res) => {
            const product = req.body
            const result = await bookingsCollection.insertOne(product)
            res.send(result)
        })

        app.put('/bookings/:id', async (req, res) => {
            const parcel = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    senderName: parcel.senderName,
                    email: parcel.email,
                    senderPhone: parcel.senderPhone,
                    parcelType: parcel.parcelType,
                    weight: parcel.weight,
                    price: parcel.price,
                    receiverName: parcel.receiverName,
                    receiverPhone: parcel.receiverPhone,
                    deliveryAddress: parcel.deliveryAddress,
                    reqDeliveryDate: parcel.reqDeliveryDate,
                    bookingDate: parcel.bookingDate,
                    latitude: parcel.latitude,
                    longitude: parcel.longitude,
                    status: parcel.status
                }
            }

            const result = await bookingsCollection.updateOne(filter, updateDoc)
            res.send(result)
        })


        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingsCollection.deleteOne(query)
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
