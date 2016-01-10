
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

console.log(decodeResponse("0027 JOIN 64.12.123.190 432"));
console.log(decodeResponse("0051 REGOK 2 129.82.123.45 5001 dinal 64.12.123.190 34001 vimul"));