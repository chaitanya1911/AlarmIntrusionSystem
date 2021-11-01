var net = require('net');
var express=require('express')
const http = require('http')
var sokcetio=require('socket.io')
const cors=require("cors");
const app = express();
var server = net.createServer();  
app.use(cors());  
const { crc16 } = require('crc');
const serverr = http.createServer(app);
const io = sokcetio(serverr);

// The port number and hostname of the server.
const port =5000; // <----------Enter the port here
const host = '192.168.1.37';  // <---------Enter local ip here

// Create a new TCP client.
const client1 = new net.Socket(); //will write command to server
client1.connect({ port: port,host:host}, function() {}); //from fixed 5000 & .150


//from controller
server.on('connection', handleConnection);    
server.on('command',handleCommand);

//handles command from client
function handleCommand(conn){

    const client = net.createConnection({port:port}) //client to get ack from server
    // The client can now send data to the server by writing to its socket.

    client1.write(conn,()=>{}); //writes command to server
    client1.on('data', function(chunk) {
        //listens to ack
        console.log(`Data received from the server: ${chunk.toString()}.`);
        //send ack to client
       client.write(chunk.toString(), function(err) { client.end(); }); 
    });
    
    client1.on('end', function() {
        console.log('Requested an end to the TCP connection');
    });
    client.on('end', function() {
        console.log('Requested an end to the TCP connection');
    });
    client1.on('error', (err)=>{
        console.log('Connection  %s error: %s', err.message); 
    });
    client.on('error', (err)=>{
        console.log('Connection Client %s error: %s', err.message); 
    });

}

//handles data recieved from server
function handleConnection(conn) {   
  var remoteAddress = conn.remoteAddress + ':' + conn.remotePort;  
  console.log('new client connection from %s', remoteAddress);
  conn.on('data', onConnData);  
  conn.on('error', onConnError);
  
  function onConnData(d) {  
  var data=d.toString('utf8')
  var str = data.split('');
  var size = str.length;
  var start_data = 0;
  var seq_start = -9999;
  var token = false;
  var start_commands = false;
  var ack_bool = false;
  var CRC = "", LLL = "", TOKEN_Event = "", SEQ_NUMBER = "", RECEVIER_NUMBER = "", ACC_PREFIX = "",
      ACC_NO = "", COMMANDS = "", TIME_STAMP = "", ACK_String = "", ACK_Write = "";
  for (var i = 1; i < size - 1; i++)
  {
      if (str != null)
      {
        
          // All the data will be present here
          if (start_data + 5 > i)
          { //CRC
              CRC = CRC + str[i];
          }
          else if (start_data + 9 > i)
          { //LLL
              LLL += str[i];
              token = true;
              ack_bool = true;
          }
          else if (token)
          { //EVENT TOKEN 
              if (str[i] == '\"' && start_data + 9 != i)
              {
                  token = false;
                  seq_start = i;
              }
              else
              {
                  if (start_data + 9 != i)
                  {
                      TOKEN_Event += str[i];
                  }
              }
          }
          else if (ack_bool)
          {
              ACK_String += str[i];
              if (seq_start + 4 >= i)
              { //SEQUENCE NUMBER
                  SEQ_NUMBER += str[i];
              }
              else if (seq_start + 11 >= i)
              { //RECEVIER_NUMBER
                  if (str[i] != 'R')
                  {
                      RECEVIER_NUMBER += str[i];
                  }
              }
              else if (seq_start + 18 >= i)
              { //ACC_PREFIX
                  if (str[i] != 'L')
                  {
                      ACC_PREFIX += str[i];
                  }
              }
              else if (seq_start + 25 >= i)
              { //ACC_NO
                  if (str[i] != '#')
                  {
                      ACC_NO += str[i];
                      start_commands = true;
                  }
              }
              else if (start_commands)
              { //start_commands

                  if (str[i] != ']')
                  {
                      COMMANDS += str[i];
                  }
                  else if (str[i + 1] == '_')
                  {
                      COMMANDS += str[i];
                      start_commands = false;
                  }
                  else
                  {
                      COMMANDS += str[i];
                  }
              }
              else
              { //TIME_STAMP
                  TIME_STAMP += str[i];
              }
          }
      }
  }
   //To calculate CRC for ack
    //Reversed 0xA001 Little Endian (DCBA) crc // 5C410020"ACK"0001R000001L000000#000000[]
    // console.log(crc16("\"SIA-DCS\"9876R579BDFL789ABC#12345A[#12345A|NFA129]").toString(16))
    var dataString = "\"ACK\"" + SEQ_NUMBER + "R" + ACC_PREFIX + "L" + RECEVIER_NUMBER + "#" + ACC_NO + "[]";
    var crc=crc16(dataString).toString(16)
    server.emit('data',data);
    var Ack_Write='\n'+crc+(dataString.length).toString(16).padStart(4,'0')+dataString+'\r';
    conn.write(Ack_Write)
  }
  
  function onConnError(err) {  
   console.log('Connection %s error: %s', remoteAddress, err.message);  
  }  
}

//connection btwn client and server
io.on('connection', socket => {
 server.on('data',(data)=>{
   socket.emit('msg',data)
  });
  
  socket.on('commandFromClient',(data)=>{
    server.emit('command',data);
})
});

//listening ports
server.listen(port);
serverr.listen(3001,()=>{
  console.log("Server running on port 3001...");
});
