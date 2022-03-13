require('dotenv').config({ path: '.env' });
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const expressSanitizer = require("express-sanitizer");
const colors = require("colors");
const bcrypt = require('bcryptjs/dist/bcrypt');
const cors = require('cors');


app.use(cors());
// allow all origin with cors
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


// APP CONFIG
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("\nConnected to DB!!!!!!!!!\n".green.bold.underline);
})
.catch((e) => {
    console.log("Failed!!!".red.bold);
    console.log(e.message.red.bold.underline);
});


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(expressSanitizer());


// MONGOOSE/MODEL CONFIG
const userSchema = new mongoose.Schema({
    id: Number,
    name: String,
    email: String,
    password: String,
    token: String,
},{timestamps: true});

const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    // user foreign key
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
},{timestamps: true});


const Contact = mongoose.model("contacts", contactSchema);
const User = mongoose.model("users", userSchema);

// RESTFUL ROUTES
app.get("/", (req, res) => {
    res.redirect("/contacts");
});


//  register
app.post("/register", (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
    });
    user.save()
    .then(() => {
        res.redirect("/login");
    })
    .catch((e) => {
        console.log(e.message);
        res.redirect("/register");
    });
});


//login
app.post("/login", (req, res) => {
    User.findOne({email: req.body.email}, (err, user) => {
        if(err) {
            console.log(err);
        } else {
            if(user) {
                if(user.password === req.body.password) {
                    res.json({
                        message: "Login successful",
                        user: user
                    });
                } else {
                    res.json({
                        message: "Incorrect password",
                        user: user
                    });
                }
            } else {
                res.json({
                    message: "User not found",
                    user: user
                });
            }
        }
    });
});


// all contacts
app.get("/contacts", (req, res) => {
    console.log("\nGET /contacts\n".blue.bold);
    Contact.find({})
    .then((contacts) => {
        res.json(contacts);
    }
    ).catch((e) => {
        console.log(e.message);
        res.json(e);
    });
});

// new contact
app.post("/contacts/new", (req, res) => {
    console.log("\nPOST /contacts\n".blue.bold);
    console.log(req.ip.yellow.bold);
    console.log(req.body);
    // console.log(req);
    req.body.name = req.sanitize(req.body.name);
    req.body.email = req.sanitize(req.body.email);
    req.body.phone = req.sanitize(req.body.phone);
    Contact.create(req.body)
    .then((newContact) => {
        res.send(newContact);
    })
    .catch((e) => {
        console.log(e.message.red.bold.underline);
    });
});


// app.get("/contacts/:id", (req, res) => {
//     console.log("\nGET /contacts/:id\n".blue.bold);
//     Contact.findById(req.params.id)
//     .then((foundContact) => {
//         res.send({"contact": foundContact});
//     })
//     .catch((e) => {
//         console.log(e.message.red.bold.underline);
//         res.send({"message": "Error !!!!"})
//     });
// });


// update contact
app.put("/contacts/:id", (req, res) => {
    console.log("\nPUT /contacts/:id\n".blue.bold);
    console.log(req.body)
    req.body.name = req.sanitize(req.body.name);
    req.body._id = req.sanitize(req.body._id);
    req.body.email = req.sanitize(req.body.email);
    req.body.phone = req.sanitize(req.body.phone);
    Contact.findByIdAndUpdate(req.params.id, req.body, (err, updatedContact) => {
        if (err) {
            console.log(err.message.red.bold);
            res.send({"message": "Error !!!!"})
        } else {
            res.send({"contact": req.body});
        }
    });
});


app.delete("/contacts/delete/:id", (req, res) => {
    console.log("\nDELETE /contacts/delete/:id\n".blue.bold);
    Contact.findByIdAndRemove(req.params.id, (err) => {
        if (err) {
            console.log("Error Occurred".red.bold)
            res.send({"message": "Error !!!!"})
        } else {
            res.send({"message": "Deleted"})
        }
    });
});


// SERVER LISTEN
app.listen(process.env.PORT, () => {
    console.log("Server has started at port " + process.env.PORT.cyan.bold);
});

