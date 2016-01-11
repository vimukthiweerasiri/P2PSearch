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
var ROUTINGTABLE = {IPs:[], PORTs:[]};
var forwardTable = {QID: [], IP: [], PORT: []};
var queryRT = {};
var countDONE = {};

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
    console.log(fileMap[fileName]);
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

    // JOIN does not have a ID
    if(dict.type != "JOIN")
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
    else if(dict.type == "JOIN"){
        dict['IP'] = arrmsg[2];
        dict['port'] = arrmsg[3];
    }
    else if(dict.type == "SEROK"){

    } else if(dict.type == "SER"){
        dict['IP'] = arrmsg[2];
        dict['PORT'] = parseInt(arrmsg[3]);
        dict['fileName'] = arrmsg[4];
        dict['qID'] = parseInt(arrmsg[5]);
    } else if(dict.type == "DONE"){
        dict['IPs'] = arrmsg[2];
        dict['port'] = parseInt(arrmsg[3]);
        dict['qID'] = parseInt(arrmsg[4]);
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


var addToRT = function (ip, port) {
    ROUTINGTABLE['IPs'].push(ip);
    ROUTINGTABLE['PORTs'].push(port);
}

var askNeighbours = function (qID, fileName) {
    countDONE[qID] = ROUTINGTABLE['PORTs'].length;
    var currentRT = queryRT[qID];
    console.log('sendig table', currentRT);
    currentRT['IPs'].forEach(function (elem, index) {
        console.log('SER', elem, currentRT['PORTs'][index], fileName, qID.toString());
        var cmd = encodeMessage('SER', HOST, PORT, fileName, qID.toString());
        sendUDPmessage(UDP, cmd, elem, currentRT['PORTs'][index]);
    });
}


var initSearch = function (term) {
    var qID = new Date().getTime();
    forwardTable.QID.push(qID);
    forwardTable.IP.push('-1');
    forwardTable.PORT.push(-1);

    queryRT[qID] = ROUTINGTABLE;

    searchInNode(term);
    askNeighbours(qID, term);
}

var handleDone = function (qID) {
    var count = countDONE[qID];
    countDONE[qID] = count - 1;
    var idx = forwardTable.QID.indexOf(qID);
    console.log('GOT DOME', forwardTable.PORT[idx], countDONE[qID]);

    if(countDONE[qID] == 0){
        if(forwardTable.PORT[idx] != -1){
            console.log('DONE SENT BY COLLECTING', forwardTable.IP[idx], forwardTable.PORT[idx]);
            var cmd = encodeMessage('DONE', forwardTable.IP[idx], forwardTable.PORT[idx], qID);
            sendUDPmessage(UDP, cmd, forwardTable.IP[idx], forwardTable.PORT[idx]);
        } else {
            console.log("Search is finished baby");
        }

    }

}

var handleSearch = function (ip, port, fileName, qID) {
    // if the query has already come

    if(forwardTable.QID.indexOf(qID) > -1) {
        console.log('DONE SENT BY BUSY', ip, port, qID);
        var cmd = encodeMessage('DONE', ip, port, qID);
        sendUDPmessage(UDP, cmd, ip, port);
        return;
    }

    // don't check in predecessor
    var idxRT;
    queryRT[qID] = ROUTINGTABLE;
    var currentRT = queryRT[qID];
    currentRT['IPs'].forEach(function (elem, index) {
        if(elem === ip && currentRT['PORTs'][index] === port){
            idxRT = index;
        }
    });
    currentRT['IPs'].splice(idxRT, 1);
    currentRT['PORTs'].splice(idxRT, 1);

    // update the forward table
    forwardTable.QID.push(qID);
    forwardTable.IP.push(ip);
    forwardTable.PORT.push(port);

    //if(currentRT['IPs'].length === 0){
    //    var idx = forwardTable.QID.indexOf(qID);
    //    if(idx > -1){
    //        console.log('sending DONE', forwardTable.IP[idx], forwardTable.PORT[idx]);
    //        var cmd = encodeMessage('DONE', forwardTable.IP[idx], forwardTable.PORT[idx], qID);
    //        sendUDPmessage(UDP, cmd, forwardTable.IP[idx], forwardTable.PORT[idx]);
    //    }
    //}


    searchInNode(fileName);
    // ask the neighbours
    askNeighbours(qID, fileName);
}



/////////////// servers ///////////////
// TCP Server
TCP.createServer(function(sock) {
    sock.on('data', function(message) {
        console.log(sock.remoteAddress +':'+ sock.remotePort + ':TCP>> ' + message);
        var cmd = String(message);
        // taking substring here than matching to avoid C-R etc;

        if(cmd.indexOf("DALL") > -1){
            console.log('ROUTINGTABLE', ROUTINGTABLE);
            console.log('nodeFiles', nodeFiles);
            console.log('forwardTable', forwardTable);
            console.log('queryRT', queryRT);
            console.log('fileMap', fileMap);
        }

        if(cmd.indexOf("DEBUG P RT") > -1){
            console.log(ROUTINGTABLE);
        }
        if(cmd.indexOf("DEBUG JOIN") > -1){
            console.log(ROUTINGTABLE);
            var splstr = cmd.split(" ");
            addToRT(splstr[2], parseInt(splstr[3]));
            console.log('routing table', ROUTINGTABLE);
            connect(splstr[2], parseInt(splstr[3]));
        }
        if(cmd.indexOf("DEBUG P F") > -1){
            console.log(nodeFiles);
        }
        if(cmd.indexOf("SEARCH ") > -1){
            var searchTerms = cmd.split(" ");
            console.log('searching for: ' + searchTerms[1]);
            initSearch(searchTerms[1].toLocaleLowerCase().trim());
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
    var cmd = String(message);
    var response = decodeResponse(cmd);
    if(response.type === 'JOIN')    {
        addToRT(response.IP, response.port);
        console.log('routing table', ROUTINGTABLE);
    }
    if(response.type === 'SER'){
        console.log(response);
        handleSearch(response.IP, response.PORT, response.fileName, response.qID);
    }
    if(response.type === 'DONE'){
        handleDone(response.qID);
    }
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

var connect = function (ip, port) {
    var cmd = encodeMessage('JOIN', HOST, PORT);
    sendUDPmessage(UDP, cmd, ip, port);
}

var shuffle = function(obj1, obj2) {
    var l = obj1.length,
        i = 0,
        rnd,
        tmp1,
        tmp2;

    while (i < l) {
        rnd = Math.floor(Math.random() * i);
        tmp1 = obj1[i];
        tmp2 = obj2[i];
        obj1[i] = obj1[rnd];
        obj2[i] = obj2[rnd];
        obj1[rnd] = tmp1;
        obj2[rnd] = tmp2;
        i += 1;
    }
}

var register = function(ip, port){
    var cmd = encodeMessage('REG', HOST, PORT, USERNAME);
    sendTCPmessage(config.bootstrapIP, config.bootstrapPORT, cmd, function(err, data){
       var response = decodeResponse(String(data));
        ROUTINGTABLE['IPs'] = response.IPs == null ? [] : response.IPs;
        ROUTINGTABLE['PORTs'] = response.port == null ? [] : response.port;
        shuffle(ROUTINGTABLE['IPs'], ROUTINGTABLE['PORTs']);
        ROUTINGTABLE['IPs'].forEach(function (elem, idx) {
            if(idx < 2) connect(elem, ROUTINGTABLE['PORTs'][idx]);
        });
    });
}

register(HOST, PORT);