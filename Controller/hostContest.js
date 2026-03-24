const express=require('express');
const path=require('path')
const hostRouter=express.Router();
const {User}=require('../utils/db');
const {Contest}=require('../utils/db');
const User_M = require('../Models/User_M');
const Contest_M = require('../Models/Contest_M');
const upload = require('../utils/multer');
const cloudinary=require('../utils/cloudinary');

hostRouter.get('/host' , (req,res)=>{
    res.render('hostContest');
})

hostRouter.post('/host' ,upload.single('problemFile'), async(req,res)=>{
        
    
    const {title , description , teamSize ,category, startDate , endDate }=req.body;
    const userId=req.session.userId;
    const problemFile= req.file;
    try{
        const contest = await Contest_M.createContest(title, description, userId , startDate, endDate , category, problemFile.path, teamSize);
        res.redirect('/contest');
    }
    catch(err){
        res.status(500).send("Error creating contest");
    }
});

module.exports={
    hostRouter
}