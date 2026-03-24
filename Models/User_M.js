const {User}=require('../utils/db');

const createUser=async(name,email,password)=>{
    try{
        const newUser=new User({
            name:name,
            email:email,
            password:password
        });
        return await newUser.save();
    }
    catch(err){
        console.error("Error creating user", err);
    }
}

const add_pts=async(userId , pts)=>{
    try{
        const user=await User.findById(userId);
        if(user){
            user.points+=pts;
            await user.save();
        }
    }
    catch(err){
        console.error("Error adding points", err);
    }
}

const Hosted_Contests= async(userId)=>{
    try{
        const user=await User.findById(userId);
        const hostedContests= (await user.populate('hostedContests')).hostedContests;
        return hostedContests;
    }
    catch(err){
        console.error("Error fetching hosted contests", err);
    }
}

const Participated_Contests= async(userId)=>{
    try{
        const user = await User.findById(userId);
        const participatedContests=  (await user.populate('participatedContests')).participatedContests;
        return participatedContests;
    }
    catch(err){
        console.error("Error fetching participated contests", err);
    }
}

const friendsList = async(userId)=>{
    try{
        const user = await User.findById(userId);
        const friends = (await user.populate('friends')).friends;
        return friends;
    }
    catch(err){
        console.error("Error fetching friends list", err);
    }
}

const Host_Contest = async(userId , contestId)=>{
    try{
        const user=await User.findById(userId);
        user.hostedContests.push(contestId);
        await user.save();
    }
    catch(err){
        console.error("Error hosting contest", err);
    }
}

const Participate_Contest = async(userId , contestId)=>{
    try{
        const user = await User.findById(userId);
        user.participatedContests.push(contestId);
        await user.save();
    }
    catch(err){
        console.error("Error participating in contest", err);
    }
}

const Add_Friend = async(userId, friendId)=>{
    try{
        const user = await  User.findById(userId);
        user.friends.push(friendId);
        await user.save();
    }   
    catch(err){
        console.error("Error adding friend", err);
    }   
}

const Send_Request = async(userId, friendId)=>{
    try{
        const user =await User.findById(friendId);
        user.requests.push(userId);
        await user.save();
    }
    catch(err){
        console.error("Error sending friend request", err);
    }
}

const Leaderboard = async()=>{
    const users = await User.find().sort({points:-1}).limit(10);
    return users;
}

module.exports={
    createUser,
    add_pts,
    Hosted_Contests,
    Participate_Contest,
    Participated_Contests,
    Host_Contest,
    friendsList,
    Send_Request,
    Add_Friend,
    Leaderboard,
}