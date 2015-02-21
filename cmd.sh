#!/bin/sh

echo ""
echo ""
echo "Fetching the Chain."
epm fetch --checkout --name 2gather ${REMOTE_HOST:=104.236.140.216}:${REMOTE_PORT:=15258}
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
epm config remote_host:${REMOTE_HOST:=104.236.140.216} remote_port:${REMOTE_PORT:=15256} use_seed:true
epm config log_level:${LOG_LEVEL:=3}

# Now we need to tell the DApp about our chain and then we’re ready to VRoom.

blockchain_id=$(epm plop chainid)
root_contract=$(epm plop vars | cut -d : -f 2)

echo "Configuring package.json with blockchain_id ($blockchain_id) and "
echo "root_contract ($root_contract)."

mv package.json /tmp/

jq '.module_dependencies[0].data |= . * {blockchain_id: "'$blockchain_id'", root_contract: "'$root_contract'"}' /tmp/package.json \
  > package.json

# put the 2gather DApp in focus
sleep 5 && curl http://localhost:3000/admin/switch/2gather &
decerver
