//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");


var userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
    res.render("home");
})


app.get("/login", (req, res) => {
    res.render("login");
})


app.get("/register", (req, res) => {
    res.render("register");
})

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });

})


app.post("/register", (req, res) => {

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            })
        }
    })

});



app.post("/login", function (req, res) {
    //check the DB to see if the username that was used to login exists in the DB
    User.findOne({ username: req.body.username }, function (err, foundUser) {
        //if username is found in the database, create an object called "user" that will store the username and password
        //that was used to login
        if (foundUser) {
            const user = new User({
                username: req.body.username,
                password: req.body.password
            });
            //use the "user" object that was just created to check against the username and password in the database
            //in this case below, "user" will either return a "false" boolean value if it doesn't match, or it will
            //return the user found in the database
            passport.authenticate("local", function (err, user) {
                if (err) {
                    console.log(err);
                } else {
                    //this is the "user" returned from the passport.authenticate callback, which will be either
                    //a false boolean value if no it didn't match the username and password or
                    //a the user that was found, which would make it a truthy statement
                    if (user) {
                        //if true, then log the user in, else redirect to login page
                        req.login(user, function (err) {
                            res.redirect("/secrets");
                        });
                    } else {
                        res.redirect("/login");
                    }
                }
            })(req, res);
            //if no username is found at all, redirect to login page.
        } else {
            //user does not exists
            res.redirect("/login")
        }
    });
});

// app.post("/login", (req, res) => {
//     const user = new User({
//         username: req.body.username,
//         password: req.body.password
//     });

//     req.login(user, function (err) {
//         if (err) {
//             console.log(err);
//         } else {
//             passport.authenticate("local")(req, res, function () {
//                 res.redirect("/secrets");
//             })
//         }
//     })

// })




app.listen(3000, () => {
    console.log("Server started on port 3000.")
})