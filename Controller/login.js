const express = require('express');
const loginRouter = express.Router();
const { User } = require('../utils/db');
const User_M = require('../Models/User_M');

loginRouter.get('/', (req, res) => {
    res.render('login');
});

loginRouter.post('/', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const user = await User.findOne({ email: email, password: password });
        if (user) {
            req.session.userId = user._id;
            res.redirect('/home');
        } else {
            res.status(401).send("Invalid email or password");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error during login");
    }
});

module.exports = {
    loginRouter
};