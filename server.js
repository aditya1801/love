var express = require('express');
var app = express();
var server =require('http').createServer(app);
var mysql=require('mysql');
var io=require('socket.io').listen(server);
//$db = mysqli_connect('localhost', 'root', '', 'registration');
users= [];
var connection2 = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: "",
        database: 'registration2'
});
connection2.connect();
connections =[];
var waitingQueue = [];
var tableCount=1;
server.listen(2001);
console.log('server is running');
bodyParser = require('body-parser');


// `use` it in your express app
app.use(bodyParser.urlencoded({ extended: true}));

app.get('/',function(req,res){
	res.sendFile(__dirname + '/login.html');
});

app.get("/login", function (req, res) {
res.sendFile(__dirname + "/login.html");
}); 

app.get("/stats", function (req, res) {
res.sendFile(__dirname + "/stats.html");
});

app.get("/admin", function (req, res) {
res.sendFile(__dirname + "/admin.html");
});

app.get("/leaderboard", function (req, res) {
res.sendFile(__dirname + "/leaderboard.html");
});

app.get("/pastgame", function (req, res) {
res.sendFile(__dirname + "/pastgame.html");
});

app.get("/playrecord", function (req, res) {
res.sendFile(__dirname + "/playrecord.html");
});

app.get("/index", function (req, res) {
res.sendFile(__dirname + "/index.html");
}); 

app.get("/register", function (req, res) {
res.sendFile(__dirname + "/register.html");
});

app.get("/friendlist", function (req, res) {
res.sendFile(__dirname + "/friendlist.html");
});

app.get("/profilepage", function (req, res) {
res.sendFile(__dirname + "/profilepage.html");
});

var username;
var mrecords;
app.get("/username", function (req, res) {
res.send(username);
});
app.get("/records", function (req, res) {
res.send(mrecords);
});
app.post("/login", function (req, res) {
//res.sendFile(__dirname + "/login.html");
username = req.body.username;
var password = req.body.password;
var query = "SELECT * FROM player p,admintable a WHERE p.username='"+username+"' AND p.password='"+password+"' AND a.permission='allowed' AND a.username='"+username+"'";
var numrows;
var results;
connection2.query(query, function(err,results) {
	console.log(results.length+"&");
    numrows = results.length;

    if(numrows==1)
   { var query="UPDATE admintable SET status='online' WHERE username='"+username+"'";
           connection2.query(query);
           console.log("ur successful");
          if(results[0]['adminstatus']=='no')
          res.redirect('/index');
          else
          res.redirect('./admin');
         }
         else
         {
            console.log("im inside no errors");
            io.sockets.emit('no account',{});
         }
    
    
   
});
//console.log(numrows+"%");

console.log(query);
//console.log(results);
//console.log(req.body.password);
});
app.post("/register", function (req, res) {
//res.sendFile(__dirname + "/register.html");
 var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password_1;
  var password_2 = req.body.password_2;
  if(password==password_2)
  {
    console.log("step=2");
    var query = "SELECT * FROM player WHERE username='"+username+"'";
   
     connection2.query(query, function(err,results) {
            
            if(results.length==0)
            {console.log("step=1");
        io.sockets.emit('registered',{});
                var query = "INSERT INTO player (username, email, password,rating) VALUES('"+username+"', '"+email+"', '"+password+"',"+1000+")";
   console.log(query);
    connection2.query(query);
     var query = "INSERT INTO multiplayerrecords (username) VALUES('"+username+"')";
     connection2.query(query);
     var query = "INSERT INTO admintable (username) VALUES('"+username+"')";
     connection2.query(query);
            }
            else
            {console.log("step=3");
                io.sockets.emit('username taken',{});
            }
            
        });
   
 }
 else
 { 
    console.log("wrong password inside");
    io.sockets.emit('password unmatch',{});
 }
});

setInterval(function () {
    if (waitingQueue.length < 2)
        return;

    var index = Math.floor(Math.random() * waitingQueue.length);
    var playerX = waitingQueue[index];
    var ratingfirst=playerX.rating;
    waitingQueue.splice(index, 1);
    var p=0;
    //index = Math.floor(Math.random() * waitingQueue.length);

    console.log(index+" $% "+playerX.username);
    var min=10000;
    for(var i=0;i<waitingQueue.length;i++)
    {
       if(i==index)
        continue;
       var x=(waitingQueue[i].rating-ratingfirst);
       if(x<0)
        x*=-1;
       console.log(waitingQueue[i].username+" ^^ "+waitingQueue[i].rating+" ^^ "+ratingfirst+" ^^ "+x+" ^^ "+min);
       if(x<min)
       {
         min=x;
         p=i;
       }
    }
    console.log(p+"$$--$");
    index=p;
    var playerO = waitingQueue[index];
    waitingQueue.splice(index, 1);
     
    var tablename = "Table" + tableCount++;
    playerX.join(tablename);
    playerO.join(tablename);
    cturn=1;
    console.log('paired'+tablename+") "+cturn);

    if (playerX.username == playerO.username) {
    	console.log("its same name");
        playerO.username += "1";
        console.log(playerO.username);
        playerO.emit('renamed', playerO.username);
    }

    io.sockets.in(tablename).emit('join table',{tablename,p1:playerX.username,p2:playerO.username,cturn,p1r:playerX.rating,p2r:playerO.rating});
}, 2000);

io.sockets.on('connection',function(socket){
    console.log("###### "+socket.id+" !!!!!!!");
	connections.push(socket);
	console.log('connected : %s sockets connected',connections.length);

	//disconnect
	socket.on('disconnect',function(data){
		
		users.splice(users.indexOf(socket.username),1);
		updateUsernames();
		connections.splice(connections.indexOf(socket),1);
	console.log('disconnected : %s sockets connected',connections.length);
	});
	//send message
	
		
		socket.on('send message',function(data){
		console.log(data.tablename+" "+socket.username);
		io.sockets.in(data.tablename).emit('new message',{msg: data.val ,user : socket.username});
	});
	

	socket.on('new user',function(data,callback)
	{
       callback(true);
        socket.username =data;
        console.log(data+"$$");
        var query = "SELECT * FROM player WHERE username='"+data+"'";
        connection2.query(query, function(err,results) {
            
            socket.rating=results[0]['rating'];
            console.log(socket.rating+"%%");
            waitingQueue.push(socket);
            console.log(waitingQueue.length+"&&&");
            console.log("pushed lala");
            users.push(socket.username);
            updateUsernames();
        });
        
         
	});
	socket.on('make a move',function(data)
	{
		console.log(data.id+" "+data.turn+" "+data.playername+"@");
       io.sockets.in(data.tablename).emit('new move',{id: data.id ,turn :data.turn,playername:data.playername});
	});
	socket.on('start again',function(data)
	{
		console.log('answer me'+data.tablename);
        var p1rating,p2rating;
         var query = "SELECT * FROM player WHERE username='"+data.player1+"'";
        connection2.query(query, function(err,results) {
            
            p1rating=results[0]['rating'];
            
        });
          var query = "SELECT * FROM player WHERE username='"+data.player2+"'";
        connection2.query(query, function(err,results) {
            
            p2rating=results[0]['rating'];
            io.sockets.in(data.tablename).emit('pok',{tablename:data.tablename,p1rating,p2rating});
            
        });
      
	});
	
	socket.on('leave game',function(data)
	{
		console.log('answer me'+data.tablename);
      io.sockets.in(data.tablename).emit('leave the game',{tablename:data.tablename});
	});
    socket.on('leave queue',function(data)
    {
        console.log('answer me'+data.user);
        for(var i=0;i<waitingQueue.length;i++)
        {
            if(waitingQueue[i].username==data.user)
            {
                waitingQueue.splice(i, 1);
                break;
            }
        }

    });
    socket.on('view stats',function(data)
    {
        var query = "SELECT * FROM multiplayerrecords WHERE username='"+data.user+"'";
        connection2.query(query, function(err,results) {
          console.log(results);
          mrecords=results;
          
        });
        

    });
    socket.on('view pastgames',function(data)
    {
        var query = "SELECT * FROM pastgames WHERE realusername='"+data.user+"'";
        connection2.query(query, function(err,results) {
          
          mrecords=results;
          
        });
        

    });
    socket.on('view allgames',function(data)
    {
        var query = "SELECT * FROM pastgames ";
        connection2.query(query, function(err,results) {
          
          mrecords=results;
          
        });
        

    });
    socket.on('view leaderboard',function(data)
    {
        console.log("inside server leaderboard");
        var query = "SELECT * FROM multiplayerrecords ORDER BY rating DESC,no_of_wins DESC,no_of_loses ASC, max_winning_streak DESC,max_losing_streak ASC,max_drawing_streak DESC";
        connection2.query(query, function(err,results) {
          
          mrecords=results;
          
        });
        

    });
     socket.on('view allusers',function(data)
    {
        
        var query = "SELECT * FROM admintable ORDER BY status DESC,rating DESC,username ASC";
        connection2.query(query, function(err,results) {
          
          mrecords=results;
          
        });
        

    });
     socket.on('user logged out',function(data)
    {
        
        var query = "UPDATE admintable SET  status='offline' WHERE username='"+data.user+"'";
        connection2.query(query);
        

    });
      socket.on('block user',function(data)
    {
        var query="UPDATE admintable SET permission='blocked' WHERE username=(SELECT username FROM player WHERE username='"+data.user+"' AND adminstatus='no')"
         connection2.query(query);
        

    });
      socket.on('unblock user',function(data)
    {
        
        var query = "UPDATE admintable SET  permission='allowed' WHERE username='"+data.user+"'";
        connection2.query(query);
        

    });

     socket.on('view friendlist',function(data)
    {
        
        var query = "SELECT f.username2,p.rating FROM friendtable f,player p WHERE p.username=f.username2 AND f.username1='"+data.user+"' ORDER BY p.rating DESC,f.username2 ASC ";
        console.log(query);
        connection2.query(query, function(err,results) {
          
          mrecords=results;
          
        });
        
    });
     socket.on('add friend',function(data)
    {
        
        var query = "INSERT INTO friendtable(username1,username2) VALUES('"+data.user+"','"+data.friend+"')";
        var query2= "INSERT INTO friendtable(username1,username2) VALUES('"+data.friend+"','"+data.user+"')";
        connection2.query(query);
        connection2.query(query2);
    });
     socket.on('remove friend',function(data)
    {
        
        var query = "UPDATE friendtable SET username1='"+"',username2='"+"' WHERE username1='"+data.user+"' AND username2='"+data.friend+"'";
        var query2= "UPDATE friendtable SET username1='"+"',username2='"+"' WHERE username2='"+data.user+"' AND username1='"+data.friend+"'";
        connection2.query(query);
        connection2.query(query2);
    });
     socket.on('get user',function(data)
    {
        
        var query = "SELECT * FROM player WHERE username='"+data.user+"'";
        
        connection2.query(query, function(err,results) {
          
          mrecords=results;
          
        });
        
    });
     socket.on('change password',function(data)
    {
        
        var query = "UPDATE player SET password='"+data.newpass+"' WHERE username='"+data.user+"'";
        connection2.query(query);
        
    });
	socket.on('new record',function(data)
	{
        var currentdate=new Date();
        console.log(currentdate);
		var lastrecord;
		var currentwinningstreak,currentlosingstreak,currentdrawingstreak;
		var maxwinningstreak,maxlosingstreak,maxdrawingstreak;
		var query2,query4;
		var query = "SELECT * FROM multiplayerrecords WHERE username='"+data.user+"'";
        connection2.query(query, function(err,results) {
        lastrecord=results[0]['lastrecord'];
        currentwinningstreak=results[0]['cur_winning_streak'];
        currentlosingstreak=results[0]['cur_losing_streak'];
        currentdrawingstreak=results[0]['cur_drawing_streak'];
        maxwinningstreak=results[0]['max_winning_streak'];
        maxlosingstreak=results[0]['max_losing_streak'];
        maxdrawingstreak=results[0]['max_drawing_streak'];
        console.log(results[0]);
        console.log(results[0]['cur_winning_streak']);
        console.log(currentwinningstreak+" $$");
	    console.log(results[0]['no_of_wins']);
	    if(data.msg=="you win")
		{
            var query="UPDATE multiplayerrecords SET  no_of_wins=no_of_wins+1,rating=rating+50 WHERE username='"+data.user+"'";
            var query3="UPDATE player SET  rating=rating+50 WHERE username='"+data.user+"'";
             var query5="UPDATE admintable SET  rating=rating+50 WHERE username='"+data.user+"'";
            var query4="INSERT INTO pastgames(realusername,username1,username2,status,time,recordgame,firstturn) VALUES ('"+data.user+"','"+data.p1+"', '"+data.p2+"', 'win','"+currentdate+"','"+data.recordgame+"','"+data.firstturn+"')";
            console.log(query4);
            if(lastrecord==1||lastrecord==-1)
            	{
            		currentwinningstreak+=1;
            	 lastrecord=1;
            	 
            	}
            else
             {
             	
           	   currentwinningstreak=1;
           	   lastrecord=1;
           	 
             }
             if(currentwinningstreak>maxwinningstreak)
            	 	maxwinningstreak=currentwinningstreak;
         
             var query2="UPDATE multiplayerrecords SET  cur_winning_streak="+currentwinningstreak+",max_winning_streak="+maxwinningstreak+",lastrecord="+lastrecord+" WHERE username='"+data.user+"'";
                
		}
		else if(data.msg=="you lose")
		{
            var query3="UPDATE player SET  rating=rating-50 WHERE username='"+data.user+"'";
            var query="UPDATE multiplayerrecords SET  no_of_loses=no_of_loses+1,rating=rating-50 WHERE username='"+data.user+"'";
            var query4="INSERT INTO pastgames(realusername,username1,username2,status,time,recordgame,firstturn) VALUES ('"+data.user+"','"+data.p1+"', '"+data.p2+"', 'lose','"+currentdate+"','"+data.recordgame+"','"+data.firstturn+"')";
             var query5="UPDATE admintable SET  rating=rating+50 WHERE username='"+data.user+"'";
            if(lastrecord==0||lastrecord==-1)
            	{
            		currentlosingstreak+=1;
            	 lastrecord=0;
            	 
            	}
            else
             { 
           	   currentlosingstreak=1;
           	   lastrecord=0;
           	   
             }
             if(currentlosingstreak>maxlosingstreak)
            	 	maxlosingstreak=currentlosingstreak;
            	 
             var query2="UPDATE multiplayerrecords SET  cur_losing_streak="+currentlosingstreak+",max_losing_streak="+maxlosingstreak+",lastrecord="+lastrecord+" WHERE username='"+data.user+"'";
		}
		else if(data.msg=="draw")
		{
            var query3="UPDATE player SET  rating=rating WHERE username='"+data.user+"'";
			var query="UPDATE multiplayerrecords SET  no_of_draws=no_of_draws+1 WHERE username='"+data.user+"'";
           var query4="INSERT INTO pastgames(realusername,username1,username2,status,time,recordgame,firstturn) VALUES ('"+data.user+"','"+data.p1+"', '"+data.p2+"', 'draw','"+currentdate+"','"+data.recordgame+"','"+data.firstturn+"')";
            var query5="UPDATE admintable SET  rating=rating+50 WHERE username='"+data.user+"'";
            if(lastrecord==3||lastrecord==-1)
            	{currentdrawingstreak+=1;
            	 lastrecord=3;
            	}
            else
             {
           	   currentwdrawingstreak=1;
           	   lastrecord=3;
             }
             if(currentdrawingstreak>maxdrawingstreak)
            	 	maxdrawingstreak=currentdrawingstreak;
             var query2="UPDATE multiplayerrecords SET  cur_losing_streak="+currentdrawingstreak+",max_losing_streak="+maxdrawingstreak+",lastrecord="+lastrecord+" WHERE username='"+data.user+"'";
		}
		 console.log(query);
        console.log(query2);
         var mainquery=query+";"+query2+";"+query3+";"+query4+";"+query5+";";
         console.log(mainquery);
		connection2.query(query);
		connection2.query(query2);
        connection2.query(query3);	
        connection2.query(query4);
        connection2.query(query5);
	    });
		
       
     
	});
	function updateUsernames()
	{
		io.sockets.emit('get users',users);
	}
	});
	

