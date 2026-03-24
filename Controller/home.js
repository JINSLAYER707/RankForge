const express = require('express');
const homeRouter = express.Router();
const { User } = require('../utils/db');
const {Contest}=require('../utils/db');
const User_M = require('../Models/User_M');
const Contest_M = require('../Models/Contest_M');

homeRouter.get('/home' , async(req,res)=>{
    const userId=req.session.userId;
    let contests = await Contest.find();
    if(contests.length > 0){
       res.render('home');
    }
    else{
        res.render('home');
    }
    
})

module.exports={
    homeRouter
}
