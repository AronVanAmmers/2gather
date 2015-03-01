function GenDougApi() {
	var gdaddr = sutil.stringToHex("0000000000THISISDOUG");

	var txs = {};
	//Doug Functions

	this.checkName = function(name){
		addr = esl.ll.Main(gdaddr, sutil.stringToHex("DOUG"),sutil.stringToHex(name));
		return addr
	}

	this.register = function(name, addr){
		var txData = [];
		txData.push("register");
		txData.push(name);
		txData.push(addr);

		var hash = sendMsg(gdddr, txData);
		this.trackTx(hash);
		return hash;
	}

	//Variable Functions
	//TODO

	//Permissions
	this.checkPerm = function(permname, target){
		pslot = esl.ll.Main(gdaddr, sutil.stringToHex("permnames"), sutil.stringToHex(permname));
		if (Equals(pslot,"0x0")){
			return null
		}

		pval = esl.array.Element(gdaddr,sutil.stringToHex("perms"),target,pslot);
		gpval = esl.kv.Value(gdaddr,sutil.stringToHex("global"),sutil.stringToHex(permname));
		geval = esl.array.Element(gddr,sutil.stringToHex("exclude"),target,pslot);

		if (Equals(pval,"0x0") && Equals(geval,"0x0")){
			return pval
		} else {
			return gpval
		}
	}

	this.addPerm = function(permname){
		var txData = [];
		txdata.push("addperm");
		txData.push(permname);

		var hash = sendMsg(gdddr, txData);
		this.trackTx(hash);
		return hash;
	}

	this.rmPerm = function(permname){
		var txData = [];
		txdata.push("rmperm");
		txData.push(permname);

		var hash = sendMsg(gdddr, txData);
		this.trackTx(hash);
		return hash;
	}

	this.setPerm = function(permname, target, value){
		var txData = [];
		txData.push("setperm");
		txData.push(permname);
		txData.push(target);
		txData.push(value);

		var hash = sendMsg(gdddr, txData);
		this.trackTx(hash);
		return hash;
	}

	this.setGlobal = function(permname, value)
		var txData = [];
		txData.push("setglobal");
		txData.push(permname);
		txData.push(value);

		var hash = sendMsg(gdddr, txData);
		this.trackTx(hash);
		return hash;
	}

	this.setExclude = function(permname, target, value){
		var txData = [];
		txData.push("setperm");
		txData.push(permname);
		txData.push(target);
		txData.push(value);

		var hash = sendMsg(gdddr, txData);
		this.trackTx(hash);
		return hash;
	}

	//Transaction Tracking
	this.trackTx = function(txHash){
		Println("Added hash for tracking: " + txHash.slice(0,6) + "...");
		var txObj = this.newTxObj();
		txObj.status = 1;
		txs[txHash] = txObj;
		Println("Added tx data");
	}

	this.checkTx = function(txHash){
		Println("CHECKING HASH: " + txHash);
		var txObj = txs[txHash];
		if(txObj === undefined){
			return 0;
		}

		return txObj.status;
	}
		
	this.newTxObj = function(){
		return {"status" : 0 };
	}
}