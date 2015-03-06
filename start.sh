#!/bin/sh

echo ""
echo ""
echo "Fetching the Chain."
epm fetch --checkout --name 2gather ${REMOTE_HOST:=104.236.146.58}:${REMOTE_PORT:=15258}
echo "The chain has been fetched and checked out."

echo ""
echo ""
echo "Setting Defaults"
epm config key_session:${KEY_SESSION:=key_session} \
  local_host:${LOCAL_HOST:=0.0.0.0} \
  local_port:${LOCAL_PORT:=15254} \
  max_peers:${MAX_PEERS:=10}

echo ""
echo ""
echo "Setting the Key File"
if [ -z "$KEY_FILE" ]
then
  echo "No key file given."
else
  echo "Using the given key file."
  epm config key_file:${KEY_FILE}
fi

echo ""
echo ""
echo "Setting Connection."
epm config remote_host:${REMOTE_HOST:=104.236.146.58} remote_port:${REMOTE_PORT:=15256} use_seed:true
epm config log_level:${LOG_LEVEL:=3}

# Now we need to tell the DApp about our chain and then we’re ready to VRoom.

blockchain_id=$(epm plop chainid)
root_contract=${ROOT_CONTRACT:="46905240fc174f2269ae8e806f3bc6b94784664a"}

echo ""
echo ""
echo "Configuring package.json"
echo "blockchain_id: $blockchain_id"
echo "root_contract: $root_contract"
echo "peer_server_address: ${REMOTE_HOST:=104.236.146.58}:${REMOTE_PORT:=15256}"

mv package.json /tmp/

jq '.module_dependencies[0].data |= . * {peer_server_address: "'${REMOTE_HOST:=104.236.146.58}:${REMOTE_PORT:=15256}'", blockchain_id: "'$blockchain_id'", root_contract: "'$root_contract'"}' /tmp/package.json \
  > package.json

echo ""
echo ""
echo "Starting up! (Wheeeeeee says the marmot)"
echo ""
echo ""

sleep 5 && curl http://localhost:3000/admin/switch/2gather &
decerver
