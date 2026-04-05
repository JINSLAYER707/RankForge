const dotenv=require('dotenv');
dotenv.config();
const express=require('express');
const mongoose=require('mongoose');
const ejs=require('ejs');
const session=require('express-session');
const {Server}=require('socket.io');
const http=require('http');
const {createServer}=require('http');
const {loginRouter}=require('./Controller/login');
const {signupRouter}=require('./Controller/signup');
const {homeRouter}=require('./Controller/home');
const {contestRouter}=require('./Controller/contest');
const {leaderboardRouter}=require('./Controller/leaderboard');
const {hostRouter}=require('./Controller/hostContest');
const {profileRouter}=require('./Controller/profile');
const {peopleRouter}=require('./Controller/people');
const {dmRouter}=require('./Controller/dm');
const {ThreadRouter}=require('./Controller/Thread');
const chatSocket=require('./Sockets/chat.socket');
const app=express();
const server=createServer(app);
const io=new Server(server);
const port=Number(process.env.PORT) || 5000;
const mongoURL=process.env.MONGO_URL;

app.set('view engine', 'ejs');
app.set('views', __dirname + '/Views');
app.use(express.static("public"));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET
}))
app.use('/uploads', express.static('uploads'));


app.use('/', loginRouter);
app.use('/',signupRouter);
app.use('/',homeRouter);
app.use('/',contestRouter);
app.use('/',leaderboardRouter);
app.use('/',hostRouter);
app.use('/',profileRouter);
app.use('/',peopleRouter);
app.use('/',dmRouter);
app.use('/',ThreadRouter);
chatSocket(io);
mongoose.connect(mongoURL).then(()=>{
   console.log("Connected to MongoDB successfully");

}).catch((err)=>{
    console.error("Failed to connect to MongoDB",err);
})


server.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`);

 }
)
