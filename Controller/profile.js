const express=require('express');
const profileRouter=express.Router();
const { User, Contest } = require('../utils/db');
const User_M = require('../Models/User_M');

profileRouter.get('/profile' , async(req,res)=>{
    const userId=req.session.userId;
    try{
        const user = await(User.findById(userId)).populate('hostedContests').populate('participatedContests').populate('friends').populate('incomingRequests').populate('outgoingRequests');
        res.render('profile', {user:user});
    }
    catch(err){
        console.error(err);
        res.status(500).send("Error fetching profile data");
    }
});

profileRouter.get('/profile/:id' , async(req,res)=>{
    const userId=req.params.id;
    try{
        const selfId=req.session.userId;
        const self=await User.findById(selfId);
        const user = await(User.findById(userId)).populate('hostedContests').populate('participatedContests').populate('friends');
        res.render('publicProfile' , {user:user , currentUser:self});
    }
    catch(err){
        console.error(err);
        res.status(500).send("Error fetching profile data");

    }
});
profileRouter.get('/invitations' , async(req,res)=>{
    const userId=req.session.userId;
    const user=await User.findById(userId).populate('outgoingRequests').populate('incomingRequests').populate({
        path: 'joinRequests',
        populate: [
            { path: 'user', select: 'name email' },
            { path: 'contest', select: 'name' }
        ]
    })
    .populate({
        path: 'inviteRequests',
        populate: [
            { path: 'user', select: 'name email' },
            { path: 'contest', select: 'name' }
        ]
    });
    res.render('invitations', {user})
})
profileRouter.post('/friends/:id' , async(req,res)=>{
    const userId=req.session.userId;
    const friendId =req.params.id;
    const user = await User.findById(userId);
    const friend=await User.findById(friendId);
    friend.incomingRequests.push(userId);
    user.outgoingRequests.push(friendId);
    await user.save();
    await friend.save();
    res.redirect(`/profile/${friendId}`);


})
profileRouter.post('/friends/accept/:id' , async(req,res)=>{
    const userId=req.session.userId;
    const friendId=req.params.id;
    try{
        const user = await User.findById(userId);
        const friend = await User.findById(friendId);
        if(user && friend){
            user.friends.push(friendId);
            friend.friends.push(userId);
            user.incomingRequests.pull(friendId);
            friend.outgoingRequests.pull(userId);
            await user.save();
            await friend.save();
            res.redirect('/profile');
        }
    }
    catch(err){
        console.error(err);
        res.status(500).send("Error accepting friend request");
    }
})

profileRouter.post('/friends/reject/:id' , async(req,res)=>{
    const userId=req.session.userId;
    const friendId=req.params.id;
    try{
        const user = await User.findById(userId);
        const friend = await User.findById(friendId);
        if(user && friend){
            user.incomingRequests.pull(friendId);
            friend.outgoingRequests.pull(userId);
            await user.save();
            await friend.save();
            res.redirect('/profile');
        }
    }
    catch(err){
        console.error(err);
        res.status(500).send("Error rejecting friend request");
    }

})

profileRouter.post('/teams/accept/:id' , async(req,res)=>{
    const teamId=req.params.id;
    const userId=req.session.userId;
    const {contest_id}=req.body;
    const user=await User.findById(userId);
    const contest=await Contest.findById(contest_id);
    const team=contest.teams.id(teamId);
    if(team.members.includes(userId)){
        return res.redirect('/invitations');
    }
    team.members.push(userId);
    user.participatedContests.push(contest_id);
    // Remove the specific invitation from user's inviteRequests
    const inviteIndex = user.inviteRequests.findIndex(invite => 
        invite.team.toString() === teamId && invite.contest.toString() === contest_id
    );
    if(inviteIndex !== -1){
        user.inviteRequests.splice(inviteIndex, 1);
    }
    await user.save();
    await contest.save();
    res.redirect('/invitations');
})
profileRouter.post('/teams/reject/:id' , async(req,res)=>{
    const teamId=req.params.id;
    const userId=req.session.userId;
    const {contest_id}=req.body;
    const user=await User.findById(userId);
    const contest=await Contest.findById(contest_id);
    const team=contest.teams.id(teamId);
    // Remove the specific invitation from user's inviteRequests
    const inviteIndex = user.inviteRequests.findIndex(invite => 
        invite.team.toString() === teamId && invite.contest.toString() === contest_id
    );
    if(inviteIndex !== -1){
        user.inviteRequests.splice(inviteIndex, 1);
    }
    await user.save();
    await contest.save();
    res.redirect('/invitations');
})

module.exports={
    profileRouter
}
