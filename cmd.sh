#!/bin/sh

epm install --genesis contracts/genesis.json . 2gather

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
