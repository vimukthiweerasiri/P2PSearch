var config = { fileNames:[
    'Adventures of Tintin',
    'Jack and Jill',
    'Glee',
    'The Vampire Diarie',
    'King Arthur',
    'Windows XP',
    'Harry Potter',
    'Kung Fu Panda',
    'Lady Gaga',
    'Twilight',
    'Windows 8',
    'Mission Impossible',
    'Turn Up The Music',
    'Super Mario',
    'American Pickers',
    'Microsoft Office 2010',
    'Happy Feet',
    'Modern Family',
    'American Idol',
    'Hacking for Dummies'],
    minFilesPerNode: 3,
    maxFilesPerNode: 5,
    bootstrapIP: '127.0.0.1',
    bootstrapPORT: 12345
}

var TCP = require('net');
var UDP = require('dgram').createSocket('udp4');
var HOST = '127.0.0.1';
var PORT = parseInt(process.argv[2]);
var USERNAME = process.argv[3];
var ALLFILES = config.fileNames;
var ROUTINGTABLE = {'dummy':'variable'};

function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

var fileCount = Math.round(Math.random() * (config.maxFilesPerNode - config.minFilesPerNode) + config.minFilesPerNode);
var nodeFiles = shuffle(ALLFILES).slice(0, fileCount);

var fileMap = {};
nodeFiles.forEach(function (elem) {
    var tmpstr = elem;
    var strArr = tmpstr.split(" ");
    var temp = "";
    for(var i = 0; i < strArr.length; i++){
        temp += (i == 0 ? "" : " ")+strArr[i].toLowerCase();
        fileMap[temp] = elem;
    }
});

var searchInNode = function (fileName) {
    return fileMap.fileName;
}




///////////////////////////// decoding


/*
 * Decodes any message received from the boot strap server
 * Input: a string (eg: length REGOK no_nodes IP_1 port_1 IP_2 port_2 )
 * Output fofrmat: a dictionary
 */
var decodeResponse = function(strmsg) {
    var arrmsg = strmsg.split(" ");
    var dict = {};
    dict['type'] = arrmsg[1];
    dict['ID'] = parseInt(arrmsg[2], 10);
    if(dict.type == "REGOK"){
        if( dict.ID >= 1 && dict.ID <= 9995){
            var IPs = [];
            var ports = [];
            var userNames = [];
            for(i = 0; i < dict.ID; i++){
                IPs[i] = arrmsg[3+(i*3)];
                ports[i] = arrmsg[4+(i*3)];
                userNames[i] = arrmsg[5+(i*3)];
            }
            dict['IPs'] = IPs;
            dict['port'] = ports;
            dict['userNames'] = userNames;
        }
    }
    else if(dict.type == "SEROK"){

    }
    return dict;
};

/*
 * Encodes in to a message to Bootstrap server
 * Input: all strings (port can be a number)
 * Output: a string (eg: length UNREG IP_address port_no username)
 */
var encodeMessage = function(type, IP, port, arg1, arg2){
    var space  = " "
    var spaces;
    if(typeof port == 'number')
        port = port.toString();
    var msg;
    if (arg1 && arg2){
        spaces = 5;
        var msglen = 4 + spaces + type.length + IP.length + port.length + arg1.length + arg2.length;
        msg = type + space + IP + space + port + space + arg1 + space + arg2;
    }
    else if(arg1){
        spaces = 4;
        var msglen = 4 + spaces + type.length + IP.length + port.length + arg1.length;
        msg = type + space + IP + space + port + space + arg1;
    }
    else{
        spaces = 3;
        var msglen = 4 + spaces + type.length + IP.length + port.length;
        msg = type + space + IP + space + port;
    }

    var strmsg = msglen.toString();
    while(strmsg.length < 4)
        strmsg = "0".concat(strmsg);
    var ret = strmsg.concat(space, msg);
    return ret;
}

//////////////////////////////////////

console.log("Node started at " + HOST + ':' + PORT);

/////////////// servers ///////////////
// TCP Server
TCP.createServer(function(sock) {
    sock.on('data', function(message) {
        console.log(sock.remoteAddress +':'+ sock.remotePort + ':TCP>> ' + message);
        var cmd = String(message);
        // taking substring here than matching to avoid C-R etc;

        if(cmd.indexOf("DEBUG P RT") > -1){
            console.log(ROUTINGTABLE);
        }
        sock.write('got that too');
        //sendTCPmessage(TCP, sock.remoteAddress, sock.remotePort, 'rogger that too');
    });
}).listen(PORT, HOST);

console.log('Server listening on ' + HOST +':'+ PORT);

// UDP Server
UDP.on('listening', function () {
    var address = UDP.address();
    console.log('UDP Server listening on ' + address.address + ":" + address.port);
});
UDP.on('message', function (message, remote) {
    console.log(remote.address + ':' + remote.port +':UDP>>' + message);
    sendUDPmessage(UDP, 'roger that UDP', remote.address, remote.port);

});
UDP.bind(PORT, HOST);
/////////////// servers ///////////////

var sendTCPmessage = function(sendTCPIP, sendTCPPORT, message, callback){
    var TCPConnection = new TCP.Socket();
    TCPConnection.connect(sendTCPPORT, sendTCPIP, function() {
        TCPConnection.write(message);
    });
    TCPConnection.on('data', function(data) {
        console.log(sendTCPIP + ':' + sendTCPPORT + ':TCP>> ' + data);
        callback(null, data);
        TCPConnection.destroy();
    });
};

var sendUDPmessage = function (UDPcon, text, sendUDPIP, sendUDPPort) {
    var message = new Buffer(text);
    UDPcon.send(message, 0, message.length, sendUDPPort, sendUDPIP, function(err, bytes) {
        if (err) throw err;
        console.log('UDP message sent to ' + sendUDPIP +':'+ sendUDPPort);
        //UDPcon.close();
    });
};

//sendTCPmessage('127.0.0.1', 12345, '0036 REG 127.0.0.1 '+PORT+' ' + USERNAME, function(err, data){
//    console.log(String(data));
//});

var register = function(ip, port){
    var cmd = encodeMessage('REG', HOST, PORT, USERNAME);
    sendTCPmessage(config.bootstrapIP, config.bootstrapPORT, cmd, function(err, data){
       var response = decodeResponse(String(data));
        console.log(response);
    });
}

register(HOST, PORT);