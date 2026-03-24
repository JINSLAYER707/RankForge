const express=require('express');
const signupRouter=express.Router();
const { User } = require('../utils/db');
const User_M = require('../Models/User_M');

signupRouter.get('/signup' , (req,res)=>{
    res.render('signup');
})

signupRouter.post('/signup', async (req,res)=>{
    const {name , email , password}=req.body;
    try{
        const exist=await User.findOne({
            email, password
        })
        if(exist){
            res.status(400).send("User already exists");
        } else {
            const newUser = await User_M.createUser(name, email, password);
            await newUser.save();
            req.session.userId = newUser._id;
            res.redirect('/home');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error during signup");
    }
})

module.exports={
    signupRouter
}