function DeVeiwApi(session) {

	// TODO This section contains nothing that needs changing.

	/***************************************** ate/monk/ipfs stuff ************************************/
	session = session;
	methods = {};
	
	dougAddr = "cfaa4c649dc45196e21e5a91d673b7538bd72980";
	flAddr = "";
	afAddr = "";
	myaccountAddr = "";
	var mysubs = [];
	myMonkAddr = "";

	var updatefreq = 10; //number of blocks between looking for new content
	var loadnum = 10; //number of most recent videos to ensure you load
	
	// Used to handle all incoming requests. Calls the Method with the request method name.
	// Later there will probably be a skeleton of some sort, so if you want to write a dapp class, 
	// the sequence would be something like this:
	//
	// var marketApi = new DappCore(...);
	// marketApi.GetJobListings = function(...) { ... };
	// marketApi.CreateJob = function(...) { ... };
	// ...
	//
	this.handle = function(req) {
		var hFunc = methods[req.Method];
		if (typeof(hFunc) != "function"){
			return network.getWsErrorDetailed(E_NO_METHOD,"No handler for method: " + req.Method);
		}
		var jsonResp = hFunc(req.Params);
		jsonResp.Method = req.Method;
		jsonResp.Id = req.Id;
		return jsonResp;
	}
	
	// Do a transaction and return the tx hash.
	function sendMsg(addr, txIndata){
		Println("Sending message");
		for (var i = 0; i < txIndata.length; i++){
			txIndata[i] = txIndata[i].trim();
		}
		Printf("TxData: %v\n", txIndata);
		var rData = monk.Msg(addr, txIndata);
		if (rData.Error !== ""){
			return network.getWsError(rData.Error);
		}
		
		var resp = network.getWsResponse();
		resp.Result = rData.Data.Hash;
		return resp;
	};
	
	// "StorageAt". Simplify storage access. Not gonna pass errors to UI.
	function SA(accAddr, sAddr){
		var sObj = monk.StorageAt(accAddr,sAddr);
		if (sObj.Error !== ""){
			Printf("Error when accessing storage for contract '%s' at address '%s': %s\n",accAddr,sAddr,sObj.Error);
			return "";
		}
		return sObj.Data;
	};
	
	function WriteFile(data){
		var hashObj = ipfs.PushBlockString(data);
		if(hashObj.Error !== "") {
			return "";
		} else {
			// This would be the 32 byte hash (omitting the initial "1220").
			return "0x" + hashObj.Data.slice(2);
		}
	};
	
	// Takes the 32 byte hash. Prepends "1220" to create the full hash.
	function ReadFile(hash){
		var fullHash = "1220" + hash;
		var fileObj = ipfs.GetBlock(fullHash);
		
		if(fileObj.Error !== "") {
			return "";
		} else {
			// This would be the file data as a string.
			return fileObj.Data;
		}
	};

	function GetFile(hash){
		var fullHash = "1220" + hash;
		var fileObj = ipfs.GetFile(fullHash);
		
		if(fileObj.Error !== "") {
			return "";
		} else {
			// This would be the file data as a string.
			return fileObj.Data;
		}
	};
	
	/***************************************** actions/dapp logic ************************************/
	
	methods.Init = function(){

		//Find relevant contracts from Doug
		flAddr = esl.ll.Main(dougAddr,StringToHex("DOUG"), StringToHex("flaggedlist"));
		afAddr = esl.ll.Main(dougAddr,StringToHex("DOUG"), StringToHex("accountfactory"));

		myMonkAddr = monk.ActiveAddress().Data;

		//Find Account contract associated with that name
		myaccAddr = esl.kv.Value(afAddr,StringToHex("accounts"),myMonkAddr);

		//Load subs (This will be used for auto distribution of files)
		mysubs = esl.ll.GetList(myaccAddr,StringToHex("subs"));

		var resp = network.getWsResponse();
		resp.Result = true;
		return resp;
	}

	//For getting the videos associated with a channel. Passing your account address will get your own videos
	methods.GetChanVids = function(channelAddr, num) {
		//This Returns the "num" most recent videos for the channel at channelAddr
		//If num is zero then returns the full list
		var vids = esl.ll.GetPairsRev(channelAddr,StringToHex("uploads"),num);

		var ret = []
		for (var i = 0; i< vids.length; i++){
			var vdat = {};
			vdat.name = esl.kv.Value(channelAddr,StringToHex("vidnames"),vids[i].Key);
			vdat.file = vids[i].Value;
			vdat.date = esl.kv.Value(channelAddr,StringToHex("uploaddate"),vids[i].Key);
			vdat.vidnum = vids[i].Key;
			vdat.status = esl.kv.Value(channelAddr, StringToHex("status"),vids[i].Key);
			ret.push(vdat);
		}

		return ret; // @andreas I'm not sure at what points i need to do the network response and which ones I don't Some guidance here would be good
	}

	//Get Information about an account
	methods.GetChanInfo = function(channelAddr){
		var ret = {};
		ret.Owner = esl.single.Value(channelAddr,StringToHex("owner"));
		ret.Username = esl.single.Value(channelAddr,StringToHex("username"))
		ret.Created = esl.single.Value(channelAddr,StringToHex("created"))
		ret.BTCAddr = esl.single.Value(channelAddr,StringToHex("BTCAddr"))

		return ret;
	}

	//My Account Functions
	methods.setBTC = function(btcaddress){
		var txData = [];
		txData.push("setBTC");
		txData.push(btcaddress);
		return sendMsg(myaccAddr,txData);
	}
	
	// Post a video
	methods.PostVid = function(viddata){

		var txData = [];
		txData.push("upload");
		txData.push(viddata.Title);
		txData.push(viddata.fHash);

		return sendMsg(myaccAddr,txData);
	}

	// Remove your video vidnum
	methods.RemoveVid = function(vidnum){
		var txData = [];
		txData.push("remove");
		txData.push(vidnum);
		return sendMsg(myaccAddr,txData);
	}

	//Subscribe to a channel
	methods.SubTo = function(channelAddr){
		var txData = [];
		txData.push("subscribe");
		txData.push(channelAddr);

		mysubs.push(channelAddr);
		return sendMsg(myaccAddr,txData);
	}

	//unsubscribe from a channel
	methods.UnSubTo = function(channelAddr){
		var txData = [];
		txData.push("unsubscribe");
		txData.push(channelAddr);

		var i = mysubs.indexOf(channelAddr);
		mysubs.splice(i,1);

		return sendMsg(myaccAddr,txData);
	}

	//ADMINISTRATIVE FUNCTIONS
	methods.FlagVid = function(channelAddr,vidnum){
		var txData = [];
		txData.push("flag");
		txData.push(vidnum);
		return sendMsg(channelAddr,txData);
	}

	methods.GetFlaggedVids = function(num) {
		//This Returns the "num" most recent flagged videos
		//If num is zero then returns the full list
		var vids = esl.ll.GetPairsRev(flAddr,StringToHex("flaggedaddr"),num);

		var ret = []
		for (var i = 0; i< vids.length; i++){
			var vdat = {};
			vdat.account = vids[i].Value;
			vdat.vidnum = esl.kv.Value(flAddr,StringToHex("flaggedvidn"),vids[i].Key);
			vdat.casenum = vids[i].Key;
			ret.push(vdat);
		}

		var resp = network.getWsResponse();
		resp.Result = ret;
		return resp;
	}

	methods.ClearFlag = function(casenum){
		var txData = [];
		txData.push("rmflag");
		txData.push(casenum);
		return sendMsg(flAddr,txData);
	}

	// Accept an offer. Both params are strings.
	methods.Blacklist = function(casenum){
		var txData = [];
		txData.push("blacklist");
		txData.push(casenum);
		return sendMsg(flAddr,txData);
	}

	//Account Creation and removal Functions
	//Create a new account
	methods.CreateAccount = function(username){
		var txData = [];
		txData.push("create");
		txData.push(username);
		return sendMsg(afAddr,txData);
	}

	//This Deletes an account both from the usernames database and the actual contract.
	methods.DeleteAccount = function(channelAddr){
		var txData = [];
		txData.push("deleteaccount");
		return sendMsg(channelAddr,txData);
	}

	var blockN = 0;


	/***************************************** event listeners ************************************/	

	this.newBlock = function(event){
		if(blockN%updatefreq == 0){
			//Run state updates THIS PRELOADS VIDEOS FROM YOUR SUBSCRIBERS SO YOU DON"T HAVE TO WAIT 
			var vidsofsubs = [];

			for(var i = 0; i<mysubs.length; i++){
				var chan = mysubs[i];
				var tvids = GetChanVids(mysubs[i],loadnum);
				for(var j; j<tvids.length; j++){
					//For each video we find we need to check its status
					if(tvids[j].status == 5){
						//Then It is blacklisted Remove this from IPFS
						//note when blacklisted you must match against the first 14 Bytes
					} else {
						GetFile(tvids[j].file);
					}
				}
			}
		}
		blockN = blockN + 1;
	}
	
	this.newTxPre = function(event){

	}

	this.newTxPreFail = function(event){

	}

	this.newTxPost = function(event){

	}

	this.newTxPostFail = function(event){

	}

	this.startListening = function(){
		events.subscribe("monk","newBlock","", this.newBlock);
		events.subscribe("monk","newTx:pre","", this.newTxPre);
		events.subscribe("monk","newTx:pre:fail","", this.newTxPreFail);
		events.subscribe("monk","newTx:post","", this.newTxPost);
		events.subscribe("monk","newTx:post:fail","", this.newTxPostFail);
	}

	this.stopListening = function(){
		events.unsubscribe("monk","newBlock");
		events.unsubscribe("monk","newTx:pre");
		events.unsubscribe("monk","newTx:pre:fail");
		events.unsubscribe("monk","newTx:post");
		events.unsubscribe("monk","newTx:post:fail");
	}
};

// This API will be for dapps, and should use the same names as ethereum uses imo.
// It will be moved to the decerver core. <------- Don't use yet --------->
function MonkHelper(blockchain){

	bc = blockchain;

	eventCallbacks = {};

	this.StorageAt = function(accountAddress,storageAddress){
		var sa = bc.StorageAt(accountAddress, storageAddress);
		if (sa.Error !== ""){
			return "0x";
		} else {
			return sa.Data;
		}
	}

	this.Storage = function(accountAddress){
		var storage = bc.Storage(accountAddress);
		if (storage.Error !== ""){
			return null;
		} else {
			return storage.Data;
		}
	}

	this.Transact = function(recipientAddress,value,gas,gascost,data){
		
		var txRecipe = {
			"Compiled" : false,
			"Error"    : "",
            "Success"  : false,
            "Address"  : "",
			"Hash"     : ""
		};
		
		if (recipientAddress === "") {
			Println("Create transaction.");
			var addr = bc.Script(data, "lll-literal")
			if (addr.Error !== "") {
				return null;
			} else {
				txRecipe.Address = addr.Data;
				txRecipe.Compiled = true;
				txRecipe.Success = true;
			}
		} else if (data === "") {
			Println("Processing tx");
			var rData = bc.Tx(recipientAddress,value);
			if (rData.Error !== ""){
				return null;
			}
			txRecipe.Success = true;
       		txRecipe.Hash = rData.Data.Hash;
		} else if (value === ""){
			Println("Processing message");
			var txData = data.split("\n");
			for (var i = 0; i < txData.length; i++){
				txData[i] = txData[i].trim();
			}
			var rData = bc.Msg(recipientAddress,txData);
			if (rData.Error !== ""){
				return null
			}
			txRecipe.Success = true;
			txRecipe.Hash = rData.Data.Hash;
		} else {
			// TODO general purpose tx
			Println("Processing transaction");
			var txData = txData.split("\n");
			for (var i = 0; i < txData.length; i++){
				txData[i] = txData[i].trim();
			}
			
			//var rData = bc.Transact(recipientAddress,value,gas,gascost,txData);
			//if (rData.Error !== ""){
			//	return null
			//}			
			//txRecipe.Success = true;
			//txRecipe.Hash = rData.Data.Hash;
		}
		return txRecipe;
	}

	this.WatchAcc = function(addr,callbackFun){
		eventCallbacks[addr] = callbackFun;
	}

	this.UnwatchAcc = function(addr){
		if (typeof(eventCallbacks[addr]) !== "undefined")
		eventCallbacks[addr] = null;
	}

	this.newBlock = function(event){
		// Hacky way to check all new transactions. Basically listen to
		// new blocks and scan them for account updates.
		var txs = event.Resource.Transactions;
		var checked = {};
		for (tx in txs){
			var sen = tx.Sender;
			if (typeof (checked[sen]) === "undefined"){
				var cb = eventCallbacks[sen];
				if (typeof(cb) === "function"){
					cb();
				}
				checked[sen] = true;
			}
			var rec = tx.Recipient;
			if (typeof (checked[rec]) === "undefined"){
				var cb = eventCallbacks[rec];
				if (typeof(cb) === "function"){
					cb();
				}
				checked[rec] = true;
			}
			var cnb = tx.Coinbase;
			if (typeof (checked[cnb]) === "undefined"){
				var cb = eventCallbacks[cb];
				if (typeof(cb) === "function"){
					cb();
				}
				checked[cnb] = true;
			}
			
		}
	}

	// Subscribe to block events.
	events.subscribe("monk","newBlock","", this.newBlock);

	// TODO accounts and balance

}


// We overwrite the new websocket session callback with this function. It will
// create a new api and tie it to the session object.
//
// The newWsCallback function must return a function that is called every time
// a new request arrives on the channel, which is set to be the handlers 'handle'
// function.
network.newWsCallback = function(sessionObj){
	var api = new MarketApi(sessionObj);
	api.startListening();
	sessionObj.api = api;
	return function(request){
		return api.handle(request);
	};
}

// This is called when a websocket session is closed. We need to tell it to stop 
// listening for events.
network.deleteWsCallback = function(sessionObj){
	sessionObj.api.stopListening();
}
