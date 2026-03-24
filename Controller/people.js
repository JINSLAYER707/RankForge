const express=require('express');
const peopleRouter=express.Router();
const {User}=require('../utils/db');
const User_M=require('../Models/User_M');

peopleRouter.get('/people' , async(req,res)=>{
    const userId=req.session.userId;
    try{
        const user=await (User.findById(userId)).populate('friends');
        res.render('people' , {people:user.friends});
    }
    catch(err){
        console.error(err);
        res.status(500).send("Error fetching people page");
    }
});

peopleRouter.post('/people', async(req,res)=>{
    const {name}=req.body;
    const userId=req.session.userId;
    try{
        const people=await User.find({name:name});
        res.render('people' , {people:people});
    }
    catch(err){
        console.error(err);
        res.status(500).send("Error searching for people");
    }
});

module.exports={
    peopleRouter
};