function TwoGatherAPI() {
	
	var dougAddr = RootContract;
	var flAddr = "";
	var afAddr = "";
	var myaccAddr = "";
	var mysubs = [];
	var myMonkAddr = "";
	
	var currentVid = null;
	
	var vidNum = 10;

	// Used to keep track of account create and delete transactions.
	var accTx = ""; 

	// ****************************** TX tracking *****************************

	var txData = {};
	
	// Codes for polling
	// 0 - non existing
	// 1 - pending
	// 2 - failed
	// 3 - succeeded
	this.checkTx = function(txHash){
		Println("CHECKING HASH: " + txHash);
		var txObj = txData[txHash];
		if(txObj === undefined){
			return 0;
		}
		// failed
		if (txObj.status === 2){
			delete txData[txHash];
		} else if (txObj.status === 4){
			delete txData[txHash];
		}
		return txObj.status;
	}
		
	this.newTxObj = function(){
		return {"status" : 0 };
	}

	this.statUpdateBlock = function(event){
		var blockObj = event.Resource;
		if(blockObj.Transactions.length === 0){
			return;
		}
		var txs = blockObj.Transactions;
		for(var i = 0; i < txs.length; i++){
			var tx = txs[i];
			var hash = '0x' + tx.Hash;
			var txObj = txData[hash];
			if(txObj !== undefined && txObj.status == 3){
				txObj.status = 4;
			}
			if(hash === accTx){
				myaccAddr = esl.kv.Value(afAddr, StringToHex("accounts"), myMonkAddr);
				Println("Updating myaccAddr: " + myaccAddr);
				accTx = "";
			}
		}
	}
		
	this.statUpdatePost = function(event){
		var hash = "0x" + event.Resource.Hash;
		Println("Post tx received: " + hash);
		var txObj = txData[hash];
		if(txObj !== undefined && txObj.status < 3){
			txObj.status = 3;
		}
		
	}
	
	this.statUpdateFail = function(event){
		var txObj = txData[event.Resource.Hash];
		if(txObj !== undefined){
			txObj.status = 2;
		}
	}
	
	// functions for adding new type of txs
	this.trackTx = function(txHash){
		Println("Added hash for tracking: " + txHash.slice(0,6) + "...");
		var txObj = this.newTxObj();
		txObj.status = 1;
		txData[txHash] = txObj;
		Println("Added tx data");
	}
	
	// TODO all the others
	
	// ************************** Main functions *****************************
	
	// USER
	
	// Account Creation and removal Functions
	// Create a new account
	this.createAccount = function(userName) {
		var txData = [];
		txData.push("create");
		txData.push(userName);
		var hash = sendMsg(afAddr, txData);
		accTx = hash;
		this.trackTx(hash);
		return hash;
	}
	
	// This Deletes an account both from the usernames database and the actual
	// contract.
	this.deleteAccount = function(username) {
		var channelAddr = usernameToChannelAddr(username);
		var txData = [];
		txData.push("deleteaccount");
		var hash = sendMsg(channelAddr, txData);
		this.trackTx(hash);
		accTx = hash;
		return hash;
	}

	this.getSession = function(){
		if(smath.isZero(myaccAddr)){
			return null;
		} else {
			return this.getUser(channelAddrToUsername(myaccAddr));
		}
	}
	
	// Get the user data for a given user.
	this.getUser = function(userName){
		Println("Getting user");
		var channelAddr = usernameToChannelAddr(userName);
		Println("Channel address: " + channelAddr);
		if (IsZero(channelAddr)){
			Println("User not found");
			return null;
		}
		
		var userData = {};
		
		var chanData = getChanInfo(channelAddr);
		var vids = getChanVids(channelAddr);
		
		userData.user_name = sutil.hexToString(chanData.username);
		userData.user_id = chanData.owner;
		
		var ts = parseInt(chanData.created,16);

		userData.created = new Date(ts*1000).toString();
		userData.btc_address = chanData.btc_address;
		userData.doug_perm = hasDOUGPerm(userName);
		userData.blacklist_perm = hasBlacklistPerm(userName);
		userData.videos = vids;
		
		var subs = [];
		for(var i = 0; i < mysubs.length; i++){
			subs[i] = channelAddrToUsername(mysubs[i]);
		}
		userData.subscriptions = subs;
		return userData;
	}
	
	// Subscribe to a channel
	this.subTo = function(userName) {
		var channelAddr = usernameToChannelAddr(userName);
		var txData = [];
		txData.push("subscribe");
		txData.push(channelAddr);
		mysubs.push(channelAddr);
		var hash = sendMsg(myaccAddr, txData);
		this.trackTx(hash);
		return hash;
	}
	
	// unsubscribe from a channel
	this.unSubTo = function(userName) {
		var channelAddr = usernameToChannelAddr(userName);
		var txData = [];
		txData.push("unsubscribe");
		txData.push(channelAddr);
		var i = mysubs.indexOf(channelAddr);
		mysubs.splice(i, 1);
		var hash = sendMsg(myaccAddr, txData);
		this.trackTx(hash);
		return hash;
	}
	
	// My Account Functions
	this.setBTC = function(btcaddress) {
		var txData = [];
		txData.push("setBTC");
		txData.push(btcaddress);
		var hash = sendMsg(myaccAddr, txData);
		this.trackTx(hash);
		return hash;
	}

	// Grant a user doug permissions. Can only be done if you have that 
	// permissions.
	this.setDOUGPerm = function(username, on) {
		var pubAddr = usernameToAddr(username);
		var txData = [];
		txData.push("setperm");
		txData.push("doug");
		txData.push(pubAddr);
		if(on){
			txData.push("0x1");
		} else {
			txData.push("0x0");
		}
		var hash = sendMsg(dougAddr, txData);
		this.trackTx(hash);
		return hash;		
	}

	this.setBlacklistPerm = function(username, on) {
		var pubAddr = usernameToAddr(username);
		var txData = [];
		txData.push("setperm");
		txData.push("blacklist");
		txData.push(pubAddr);
		if(on){
			txData.push("0x1");
		} else {
			txData.push("0x0");
		}
		var hash = sendMsg(dougAddr, txData);
		this.trackTx(hash);
		return hash;
	}

	// VIDEO

	// Post a video
	this.addVideo = function(name, data) {
		Println("Adding file to ipfs.");
		var hash = writeFile(data);
		if(hash === ""){
			Println("Error when adding file to ipfs.");
			return "0x0";
		}
		return this.postVid(name,hash);
	}

	// Remove a video
	this.removeVideo = function(vidnum) {
		var txData = [];
		txData.push("remove");
		txData.push(vidnum);
		var hash = sendMsg(myaccAddr, txData);
		this.trackTx(hash);
		return hash;
	}
	
	// Get a video
	this.getVideoData = function(username, vidnum) {
		channelAddr = usernameToChannelAddr(username);
		var vids = esl.ll.GetPairsRev(channelAddr, StringToHex("uploads"), 10);
		for (var i = 0; i < vids.length; i++) {
			if(Equals(vids[i].Key,vidnum)){
				return vidObjToVidData(vids[i],channelAddr);
			}
		}
		return null;
	}

	// Get a video that is flagged
	this.getFlaggedVid = function(casenum) {
		
		var vdat = {};
		vdat.account = esl.ll.Main(flAddr,StringToHex("flaggedaddr"),casenum);
		vdat.vidnum = esl.kv.Value(flAddr,StringToHex("flaggedvidn"),casenum);
		vdat.casenum = casenum;

		return vdat;
	}

	this.getCasenumById = function(username,vidnum){
		Println("Get casenum by ID: " + username + "/" + vidnum);
		var channelAddr = usernameToChannelAddr(username);
		var fVids = this.getFlaggedVids(10);
		Printf("Number of flagged vids: %d\n", fVids.length);
		for(var i = 0; i < fVids.length; i++){
			var fVid = fVids[i];
			Println("Channel address: " + channelAddr);
			Println("FVID ACCOUNT: " + fVid.account);
			Println("FVID VIDNUM: " + fVid.vidnum);
			Println("FVID CASENUM: " + fVid.casenum);
			if(Equals(fVid.account,channelAddr)){
				if(Equals(fVid.vidnum,vidnum)){
					return fVid.casenum;
				}
			}
		}
		return "0x0";
	}

	this.getFlaggedVidById = function(username,vidnum) {
		var casenum = this.getCasenumById(username,vidnum);
		if(Equals(casenum,"0x0")){
			return "0x0";
		}
		return this.getFlaggedVid(casenum);
	}

	this.flagVid = function(username, vidnum) {
		Println("FLAGGING VID: " + username + "/" + vidnum);
		var channelAddr = usernameToChannelAddr(username);
		var txData = [];
		txData.push("flag");
		txData.push(vidnum);
		var hash = sendMsg(channelAddr, txData);
		this.trackTx(hash);
		return hash;
	}

	// clear the flag off a video
	this.clearFlagById = function(username,vidnum) {
		Println("Clear flags by ID: " + username + "/" + vidnum);
		var casenum = this.getCasenumById(username,vidnum);
		Println("CaseNum: " + casenum);
		if(Equals(casenum,"0x0")){
			Println("Casenum is 0");
			return "0x0";
		}
		return this.clearFlag(casenum);
	}

	// clear the flag off a video
	this.clearFlag = function(casenum) {
		var txData = [];
		txData.push("rmflag");
		txData.push(casenum);
		var hash = sendMsg(flAddr, txData);
		this.trackTx(hash);
		return hash;
	}

	this.blacklistById = function(username,vidnum){
		Println("Blacklist by ID: " + username + "/" + vidnum);
		var casenum = this.getCasenumById(username,vidnum);
		Println("CaseNum: " + casenum);
		if(Equals(casenum,"0x0")){
			Println("Casenum is 0");
			return "0x0";
		}
		return this.blacklist(casenum);
	}

	// Accept an offer. Both params are strings.
	this.blacklist = function(casenum) {
		var txData = [];
		txData.push("blacklist");
		txData.push(casenum);
		var hash = sendMsg(flAddr, txData);
		this.trackTx(hash);
		return hash;
	}

	
	// ************************ Helpers ***************************
	
	// Takes a username and gets the address, if any.
	function usernameToAddr(username){
		return esl.ll.Main(afAddr,sutil.stringToHex("usernames"), sutil.stringToHex(username));
	};
	
	// Takes a user name and returns the channel address, if any.
	function usernameToChannelAddr(username){
		var pubAddr = esl.ll.Main(afAddr,sutil.stringToHex("usernames"),sutil.stringToHex(username));
		return esl.kv.Value(afAddr,sutil.stringToHex("accounts"),pubAddr);
	};
	
	function channelAddrToUsername(channelAddr){
		return sutil.hexToString(esl.single.Value(channelAddr, sutil.stringToHex("username")));
	};
	
	// For getting the videos associated with a channel. Passing your account
	// address will get your own videos
	function getChanVids(channelAddr) {
		// This Returns the "num" most recent videos for the channel at
		// channelAddr
		// If num is zero then returns the full list

		var vids = esl.ll.GetPairsRev(channelAddr, StringToHex("uploads"), 10);

		var ret = [];
		for (var i = 0; i < vids.length; i++) {
			ret.push(vidObjToVidData(vids[i],channelAddr));
		}
		return ret;
	};

	function vidObjToVidData(vidObj,channelAddr){
		var vdat = {};
		vdat.name = sutil.hexToString(esl.kv.Value(channelAddr, StringToHex("vidnames"),
				vidObj.Key));
		vdat.date = esl.kv.Value(channelAddr, StringToHex("uploaddate"),
				vidObj.Key);
		vdat.id = vidObj.Key;
		vdat.status = esl.kv.Value(channelAddr, StringToHex("status"),
				vidObj.Key);
		var vidHash = "1220" + vidObj.Value.slice(2);
		vdat.url = ipfs.GetFileURL(vidHash,false).Data;
		return vdat;
	}	

	// Get Information about an account
	function getChanInfo(channelAddr) {
		var ret = {};
		ret.owner = esl.single.Value(channelAddr, StringToHex("owner"));
		ret.username = esl.single.Value(channelAddr, StringToHex("username"));
		ret.created = esl.single.Value(channelAddr, StringToHex("created"));
		ret.btc_address = esl.single.Value(channelAddr, StringToHex("BTCAddr"));
		return ret;
	}
	
	// Check if a user has doug permissions.
	function hasDOUGPerm(username){
		
		var pubAddr = usernameToAddr(username);
		var DOUGIndex = esl.ll.Main(dougAddr,StringToHex("permnames"),StringToHex("doug"));
		var Permval = esl.array.Element(dougAddr,StringToHex("perms"),pubAddr,DOUGIndex);
		if (Equals(Permval, "0x1")){
			return true;
		} else {
			return false;
		}
	};

	// Check if a user has video blacklisting permissions.
	function hasBlacklistPerm(username){
		
		var pubAddr = usernameToAddr(username);
		var BlacklistIndex = esl.ll.Main(dougAddr,StringToHex("permnames"),StringToHex("blacklist"));
		var Permval = esl.array.Element(dougAddr,StringToHex("perms"),pubAddr,BlacklistIndex);
		if (Equals(Permval, "0x1")){
			return true;
		} else {
			return false;
		}
		
	};
	
	// Channel obtaining functions
	function getAllAccounts() {
		
		var allacc = esl.ll.GetPairs(afAddr, StringToHex("usernames"), 0);
		var ret = [];
		for (var i = 0; i < allacc.length; i++) {
			var accdat = {};
			accdat.username = allacc[i].Value;
			accdat.pubAddr = allacc[i].Key;
			accdat.chanAddr = esl.kv.Value(afAddr, StringToHex("accounts"),
					allacc[i].Key);
			ret.push(accdat);
		}
		return ret;
		
	};

	// Find an account
	/*
	this.findAccount = function(username) {
		var accPubAddr = esl.ll
				.Main(afAddr, StringToHex("usernames"), username);
		if (accPubAddr == 0) {
			return nil;
		} else {
			return esl.kv.Value(afAddr, StringToHex("accounts"), accPubAddr);
		}
	}
	*/

	// ADMINISTRATIVE FUNCTIONS

	// Get the flagged vids
	this.getFlaggedVids = function(num) {
		// This Returns the "num" most recent flagged videos
		// If num is zero then returns the full list
		var vids = esl.ll.GetPairsRev(flAddr, StringToHex("flaggedaddr"), num);

		var ret = [];
		for (var i = 0; i < vids.length; i++) {
			var vdat = {};
			vdat.account = vids[i].Value;
			vdat.vidnum = esl.kv.Value(flAddr, StringToHex("flaggedvidn"),
					vids[i].Key);
			vdat.casenum = vids[i].Key;
			ret.push(vdat);
		}
		return ret;
	};

	
	// Run state updates THIS PRELOADS VIDEOS FROM YOUR SUBSCRIBERS SO YOU DON"T
	// HAVE TO WAIT
	/*
	this.sync = function() {
		var vidsofsubs = [];

		for (var i = 0; i < mysubs.length; i++) {
			var chan = mysubs[i];
			var tvids = GetChanVids(mysubs[i], loadnum);
			for (var j; j < tvids.length; j++) {
				// For each video we find we need to check its status
				if (tvids[j].status == 5) {
					// Then It is blacklisted Remove this from IPFS
					// note when blacklisted you must match against the first 14
					// Bytes
				} else {
					GetFile(tvids[j].file);
				}
			}
		}
	}
	*/

	// Post a video
	this.postVid = function(name, hash) {
		var txData = [];
		txData.push("upload");
		// This is the correct order.
		txData.push(hash);
		txData.push(name);
		var hash = sendMsg(myaccAddr, txData);
		this.trackTx(hash);
		return hash;
	}

	// No websockets running here, meaning there's only one possible sub from this runtime.
	this.sub = function() {
		events.subscribe("monk","newBlock","", this.statUpdateBlock, "does_not_matter_since_not_websocket");
		events.subscribe("monk","newTx:post","", this.statUpdatePost, "does_not_matter_since_not_websocket");
		events.subscribe("monk","newTx:pre:fail","", this.statUpdateFail, "does_not_matter_since_not_websocket");
		events.subscribe("monk","newTx:post:fail","", this.statUpdateFail, "does_not_matter_since_not_websocket");
	}
	
	// No websockets running here, meaning there's only one possible sub from this runtime.
	function unsub(){
		events.unsubscribe("monk","newBlock", "does_not_matter_since_not_websocket");
		events.unsubscribe("monk","newTx:post","does_not_matter_since_not_websocket");
		events.unsubscribe("monk","newTx:pre:fail","does_not_matter_since_not_websocket");
		events.unsubscribe("monk","newTx:post:fail","does_not_matter_since_not_websocket");
	}

	// This needs to be run when the dapp is started.
	this.init = function() {
		Println("Initializing 2gather");
		// Start subscribing to tx events.
		this.sub();
		Println("DOUG address: " + dougAddr);
		// Find relevant contracts from Doug
		flAddr = esl.ll.Main(dougAddr, StringToHex("DOUG"),
				StringToHex("flaggedlist"));
		Println("flAddr: " + flAddr);
		afAddr = esl.ll.Main(dougAddr, StringToHex("DOUG"),
				StringToHex("accountfactory"));

		Println("afAddr: " + afAddr);

		myMonkAddr = "0x" + monk.ActiveAddress().Data;
		Println("My address: " + myMonkAddr);
		// Find Account contract associated with that name
		myaccAddr = esl.kv.Value(afAddr, StringToHex("accounts"), myMonkAddr);
		Println("My Account address: " + myaccAddr);
		Printf("mysubs %v\n",mysubs);
	}
};
