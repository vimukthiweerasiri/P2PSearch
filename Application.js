var TCP = require('net');
var UDP = require('dgram').createSocket('udp4');
var HOST = '127.0.0.1';
var PORT = parseInt(process.argv[2]);
var USERNAME = process.argv[3];

/////////////// servers ///////////////
// TCP Server
TCP.createServer(function(sock) {
    sock.on('data', function(message) {
        console.log(sock.remoteAddress +':'+ sock.remotePort + ':TCP>> ' + message);
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

sendTCPmessage('127.0.0.1', 12345, '0036 REG 127.0.0.1 '+PORT+' ' + USERNAME, function(err, data){
    console.log(String(data));
});