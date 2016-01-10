
/* 
 * Decodes any message received from the boot strap server
 * Input: a string (eg: length REGOK no_nodes IP_1 port_1 IP_2 port_2 )
 * Output fofrmat: a dictionary
 */
var decodeResponse = function(strmsg) {
    var arrmsg = strmsg.split(" ");
    var dict = {};
    dict['type'] = arrmsg[1];
    if(1 == arrmsg[2]){
    	dict['ID'] = arrmsg[2];
    	dict['IP_1'] = arrmsg[3];
    	dict['port_1'] = arrmsg[4];
    }
    else if(2 == arrmsg[2]){
    	dict['ID'] = arrmsg[2];
    	dict['IP_1'] = arrmsg[3];
    	dict['port_1'] = arrmsg[4];
    	dict['IP_2'] = arrmsg[5];
    	dict['port_2'] = arrmsg[6];
    }
    else{
    	dict['ID'] = arrmsg[2];
    }
    return dict;
};

/*
 * Encodes in to a message to Bootstrap server 
 * Input: all strings
 * Output: a string (eg: length UNREG IP_address port_no username)
 */
var encodeMessage = function(type, IP, port, username){
	var space  = " "
	var spaces = 4;
	var msglen = 4 + spaces + type.length + IP.length + port.length + username.length;
	var strmsg = msglen.toString();
	while(strmsg.length < 4)
		strmsg = "0".concat(strmsg);
	var ret = strmsg.concat(space, type, space, IP, space, port, space,username);
	return ret;
}



