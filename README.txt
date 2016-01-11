Phase 2 : p2pSearch
-------------------

--configuration--

config.js file has the configurations for the application, you can change,
	1. file list (default: the given list)
	2. boostrap server IP (default: 127.0.0.1)
	3. bootstrap server PORT (default: 12345)
	4. minimum files per Node (default: 3)
	5. maximum files per Node (default: 5)

--First run the boostrap server--

cd BootStrapServer && gcc P2PRegistry.c && ./a.out 12345

--Creating Nodes--

node Application.js <port number> <user name> <-D>

the -D arg is optional, it prints the debug messages

--Search--

Connect to the node with netcat first
nc <node IP> <node PORT> then type,
SEARCH <file name>
this will give the results

--print properties of the node--
after connecting to the node with netcat, send
1. DEBUG P RT // this prints the routing table
2. DEBUG JOIN <IP> <PORT> // the node will send a join message to the specified node IP and PORT
3. DEBUG P F // prints the files list
4. DALL // prints routing table, nodeFiles, forwardTable, queryRT, fileMap

** the project is written in nodeJS, here are the official download instructions: https://nodejs.org/en/download/package-manager/
