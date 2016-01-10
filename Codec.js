
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
    if(dict.type == "REGOK" || dict.type == "UNROK"){
        if( dict.ID >= 1 && dict.ID <= 9995){
            for(i = 1; i <= dict.ID; i++){
                dict['IP_'+i] = arrmsg[2+i];
                dict['port_'+i] = arrmsg[3+i];
            }
        }   
    }
    else if(dict.type == "SEROK"){

    }
    return dict;
};

/*
 * Encodes in to a message to Bootstrap server 
 * Input: all strings
 * Output: a string (eg: length UNREG IP_address port_no username)
 */
var encodeMessage = function(type, IP, port, arg1, arg2){
	var space  = " "
	var spaces;
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
