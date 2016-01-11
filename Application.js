var config = require('./config');
var codec = require('./Codec');
var misc = require('./misc');
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


var fileCount = Math.round(Math.random() * (config.maxFilesPerNode - config.minFilesPerNode) + config.minFilesPerNode);
var nodeFiles = misc.shuffleArray(ALLFILES).slice(0, fileCount);

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

var printResults = function (incomingMessage, qID) {
    console.log('--------------');
    console.log('\x1b[36m', incomingMessage ,'\x1b[0m');

    console.log('--------------');
}

var handleResult = function (incomingMessage, qID) {
    var idx = forwardTable.QID.indexOf(qID);
    console.log(forwardTable);
    console.log(qID);

    console.log('RESULT to', idx, forwardTable.IP[idx], forwardTable.PORT[idx]);
    if(forwardTable.PORT[idx] == -1){
        printResults(incomingMessage, qID);
    } else{
        console.log('FORWARDING to', forwardTable.IP[idx], forwardTable.PORT[idx]);
        sendUDPmessage(UDP, incomingMessage, forwardTable.IP[idx], forwardTable.PORT[idx]);
    }
}

var sendResults = function (result, qID) {
    var noSpace = result.trim().replace(/\s+/g, '_');
    var cmd = codec.encodeMessage('RESULT', HOST, PORT, qID, noSpace);
    handleResult(cmd, qID)
}

var searchInNode = function (fileName, qID) {
    console.log(fileMap[fileName]);
    if(fileMap[fileName] != null){
        sendResults(fileMap[fileName], qID);
        console.log('-----------------');
        console.log('FOUND ON', HOST, PORT);
        console.log(fileMap[fileName]);
        console.log('-----------------');
    }
}


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
        var cmd = codec.encodeMessage('SER', HOST, PORT, fileName, qID.toString());
        sendUDPmessage(UDP, cmd, elem, currentRT['PORTs'][index]);
    });
}

var initSearch = function (term) {
    var qID = new Date().getTime();
    forwardTable.QID.push(qID);
    forwardTable.IP.push('-1');
    forwardTable.PORT.push(-1);

    queryRT[qID] = ROUTINGTABLE;

    searchInNode(term, qID);
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
            var cmd = codec.encodeMessage('DONE', forwardTable.IP[idx], forwardTable.PORT[idx], qID);
            sendUDPmessage(UDP, cmd, forwardTable.IP[idx], forwardTable.PORT[idx]);
        } else {
            console.log('\x1b[36m', 'SEARCHING IS DONE BABY' ,'\x1b[0m');
        }

    }

}

var handleSearch = function (ip, port, fileName, qID) {
    // if the query has already come

    if(forwardTable.QID.indexOf(qID) > -1) {
        console.log('DONE SENT BY BUSY', ip, port, qID);
        var cmd = codec.encodeMessage('DONE', ip, port, qID);
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

    searchInNode(fileName, qID);
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
    var response = codec.decodeResponse(cmd);
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
    if(response.type === 'RESULT'){
        handleResult(cmd, response.qID);
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

var connect = function (ip, port) {
    var cmd = codec.encodeMessage('JOIN', HOST, PORT);
    sendUDPmessage(UDP, cmd, ip, port);
}

var register = function(ip, port){
    var cmd = codec.encodeMessage('REG', HOST, PORT, USERNAME);
    sendTCPmessage(config.bootstrapIP, config.bootstrapPORT, cmd, function(err, data){
       var response = codec.decodeResponse(String(data));
        ROUTINGTABLE['IPs'] = response.IPs == null ? [] : response.IPs;
        ROUTINGTABLE['PORTs'] = response.port == null ? [] : response.port;
        misc.shuffle(ROUTINGTABLE['IPs'], ROUTINGTABLE['PORTs']);
        ROUTINGTABLE['IPs'].forEach(function (elem, idx) {
            if(idx < 2) connect(elem, ROUTINGTABLE['PORTs'][idx]);
        });
    });
}

//register(HOST, PORT);