const express=require('express');
const leaderboardRouter=express.Router();
const { User } = require('../utils/db');
const {Contest}=require('../utils/db');
const User_M = require('../Models/User_M');
const Contest_M = require('../Models/Contest_M');

leaderboardRouter.get('/leaderboard' , async(req,res)=>{
    const userId=req.session.userId;
    const leaderboard = await User_M.Leaderboard();
    if(leaderboard.length > 3){
    const firstPlace = leaderboard[0];
    const secondPlace = leaderboard[1];
    const thirdPlace = leaderboard[2];
    res.render('leaderboard' , {users:leaderboard, first:firstPlace, second:secondPlace, third:thirdPlace});

    }
    else{
        res.render('leaderboard' , {users:[], first:{}, second:{}, third:{}});
    }
    
}

);

module.exports={
    leaderboardRouter
}