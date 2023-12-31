const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

const uri = process.env.MONGO_URI;

const app = express()
app.use(bodyParser.json());
app.use(cors());

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Welcome to Khareedlo')
})


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const productCollection = client.db(`${process.env.DB_NAME}`).collection("products");
  const orderCollection = client.db(`${process.env.DB_NAME}`).collection("Orders");
  
    console.log('db connect')

    app.get('/products', (req, res) => {
        productCollection.find({})
            .toArray((err, document) => res.send(document))
    })
    
    productCollection.createIndex({ productName: "text" });
    app.get('/search', (req, res) => {
        if (!req.query.keyword) {
            return productCollection.find({})
                .toArray((err, docs) => res.send(docs))
        }
        productCollection.find({ $text: { $search: req.query.keyword } })
            .toArray((err, docs) => res.send(docs))
    })

    app.get('/orders', (req, res) => {
        const queryEmail = req.query.email;
        orderCollection.find({ email: queryEmail })
            .toArray((err, docs) => res.send(docs))
    })

    app.post('/addProduct', (req, res) => {
        productCollection.insertOne(req.body)
            .then(result => res.send(!!result.insertedCount))
    })

    app.post('/addOrder', (req, res) => {
        const order = req.body;
        orderCollection.insertOne(order)
            .then(result => res.send(!!result.insertedCount))
    })

    app.delete('/delete/:id', (req, res) => {
        productCollection.deleteOne({ _id: ObjectId(req.params.id) })
            .then(result => {
                res.send(!!result.deletedCount)
            })
    })

    app.patch('/update/:id', (req, res) => {
        productCollection.updateOne(
            { _id: ObjectId(req.params.id) },
            {
                $set: req.body
            }
        ).then(result => {
            res.send(result.modifiedCount > 0)
        })
    })

});

app.listen(port);
