#!/bin/bash

GREEN='\033[1;32m'
NC='\033[0m'

printf "${GREEN}Switching to 2gather - will fail if already in focus, but this does not matter.\n${NC}"
curl http://localhost:3000/admin/switch/2gather
printf "\n"

sleep 2

echo -e "${GREEN}*********** Create user 'tester' ************${NC}"

CREATE_USER_HASH=$(curl -X POST -H "Content-Type: application/json" -d '{"user_name":"tester"}' http://localhost:3000/apis/2gather/user)
printf "TX HASH: $CREATE_USER_HASH\n"

# Get
echo "User data:"
curl http://localhost:3000/apis/2gather/user/tester
printf "\n"

sleep 1

echo -e "${GREEN}*********** Set bitcoin address ************${NC}"

SET_BTC_HASH=$(curl -X PATCH -H "Content-Type: application/json" -d '[{"op":"replace", "field" : "btc_addr", "value" : "0x111111111111"}]' http://localhost:3000/apis/2gather/user/tester)
printf "TX HASH: $SET_BTC_HASH\n"53          6

# Get
echo "User data:"
curl http://localhost:3000/apis/2gather/user/tester
printf "\n"

sleep 1

echo -e "${GREEN}*********** Unset bitcoin address ************${NC}"

UNSET_BTC_HASH=$(curl -X PATCH -H "Content-Type: application/json" -d '[{"op":"remove", "field" : "btc_addr", "value" : ""}]' http://localhost:3000/apis/2gather/user/tester)
printf "TX HASH: $UNSET_BTC_HASH\n"

sleep 1

# Get
echo "User data:"
curl http://localhost:3000/apis/2gather/user/tester
printf "\n"

echo -e "${GREEN}*********** Add subscription ************${NC}"

ADD_SUB_HASH=$(curl -X POST -H "Content-Type: application/json" -d '{"user_name":"tester"}' http://localhost:3000/apis/2gather/user/tester/subs)
printf "TX HASH: $ADD_SUB_HASH\n"

# Get 
echo "User data:"
curl http://localhost:3000/apis/2gather/user/tester
printf "\n"

sleep 1

echo -e "${GREEN}*********** Remove subscription ************${NC}"

REMOVE_SUB_HASH=$(curl -X DELETE http://localhost:3000/apis/2gather/user/tester/subs/tester)
printf "TX HASH: $REMOVE_SUB_HASH\n"

# Get
echo "User data:"
curl http://localhost:3000/apis/2gather/user/tester
printf "\n"

sleep 1

echo -e "${GREEN}*********** Add video ************${NC}"

# Add a test video.
ADD_VIDEO_HASH=$(curl -X POST -H "Content-Type: application/json" -d '{"name":"testvid", "url":"/home/androlo/small.mp4"}' http://localhost:3000/apis/2gather/user/tester/videos)
printf "TX HASH: $ADD_VIDEO_HASH\n"

# Get
echo "User data:"
curl http://localhost:3000/apis/2gather/user/tester
printf "\n"

sleep 1

echo -e "${GREEN}*********** Flag video ************${NC}"

FLAG_VIDEO_HASH=$(curl -X PATCH -H "Content-Type: application/json" -d '[{"op":"replace", "field" : "flag", "value" : true}]' http://localhost:3000/apis/2gather/user/tester/videos/0x1)
printf "TX HASH: $FLAG_VIDEO_HASH\n"

# Get
echo "User data:"
curl http://localhost:3000/apis/2gather/user/tester
printf "\n"

sleep 1

echo -e "${GREEN}*********** Unflag video ************${NC}"

UNFLAG_VIDEO_HASH=$(curl -X PATCH -H "Content-Type: application/json" -d '[{"op":"remove", "field" : "flag", "value" : false}]' http://localhost:3000/apis/2gather/user/tester/videos/0x1)
printf "TX HASH: $UNFLAG_VIDEO_HASH\n"

# Get
echo "User data:"
curl http://localhost:3000/apis/2gather/user/tester
printf "\n"

sleep 1

echo -e "${GREEN}*********** Remove video ************${NC}"

REMOVE_VIDEO_HASH=$(curl -X DELETE http://localhost:3000/apis/2gather/user/tester/videos/0x1)
printf "TX HASH: $REMOVE_VIDEO_HASH\n"

# Get
echo "User data:"
curl http://localhost:3000/apis/2gather/user/tester
printf "\n"

sleep 1

echo -e "${GREEN}*********** Add video 2 ************${NC}"

# Add a test video.
ADD_VIDEO_HASH2=$(curl -X POST -H "Content-Type: application/json" -d '{"name":"testvid", "url":"$HOME/.decerver/dapps/2gather/test.mp4"}' http://localhost:3000/apis/2gather/user/tester/videos)
printf "TX HASH: $ADD_VIDEO_HASH2\n"

# Get
echo "User data:"
curl http://localhost:3000/apis/2gather/user/tester
printf "\n"

sleep 1

echo -e "${GREEN}*********** Flag video 2 ************${NC}"

FLAG_VIDEO_HASH2=$(curl -X PATCH -H "Content-Type: application/json" -d '[{"op":"replace", "field" : "flag", "value" : true}]' http://localhost:3000/apis/2gather/user/tester/videos/0x2)
printf "TX HASH: $FLAG_VIDEO_HASH2\n"

# Get
echo "User data:"
curl http://localhost:3000/apis/2gather/user/tester
printf "\n"

sleep 1

echo -e "${GREEN}*********** Blacklist video ************${NC}"

BLACKLIST_VIDEO_HASH=$(curl -X PATCH -H "Content-Type: application/json" -d '[{"op":"replace", "field" : "blacklist", "value" : true}]' http://localhost:3000/apis/2gather/user/tester/videos/0x2)
printf "TX HASH: $BLACKLIST_VIDEO_HASH\n"

# Get to see values
echo "User data:"
curl http://localhost:3000/apis/2gather/user/tester
printf "\n"

sleep 1

echo -e "${GREEN}*********** Remove video 2 ************${NC}"

REMOVE_VIDEO_HASH2=$(curl -X DELETE http://localhost:3000/apis/2gather/user/tester/videos/0x1)
printf "TX HASH: $REMOVE_VIDEO_HASH2\n"

# Get
echo "User data:"
curl http://localhost:3000/apis/2gather/user/tester
printf "\n"

sleep 1

echo -e "${GREEN}*********** Remove blacklist permission ************${NC}"

UNSET_BLACKLIST_HASH=$(curl -X PATCH -H "Content-Type: application/json" -d '[{"op":"remove", "field" : "blacklist_perm", "value" : false }]' http://localhost:3000/apis/2gather/user/tester)
printf "TX HASH: $UNSET_BLACKLIST_HASH\n"

sleep 1

# Get to see values
echo "User data:"
curl http://localhost:3000/apis/2gather/user/tester
printf "\n"

echo -e "${GREEN}*********** Set user blacklist permission ************${NC}"

SET_BLACKLIST_HASH=$(curl -X PATCH -H "Content-Type: application/json" -d '[{"op":"replace", "field" : "blacklist_perm", "value" : true }]' http://localhost:3000/apis/2gather/user/tester)
printf "TX HASH: $SET_BLACKLIST_HASH\n"

# Get
echo "User data:"
curl http://localhost:3000/apis/2gather/user/tester
printf "\n"

sleep 1

echo -e "${GREEN}*********** Delete user 'tester' ************${NC}"

DELETE_USER_HASH=$(curl -X DELETE http://localhost:3000/apis/2gather/user/tester)
printf "TX HASH: $DELETE_USER_HASH\n"

# Get
echo "User data:"
curl http://localhost:3000/apis/2gather/user/tester
printf "\n"
sleep 1

echo -e "${GREEN}*********** Check transaction statuses ************\n\n${NC}"

printf "User create tx status: "
curl http://localhost:3000/apis/2gather/txs/${CREATE_USER_HASH//\"}
printf "\n"

printf "User delete tx status: "
curl http://localhost:3000/apis/2gather/txs/${DELETE_USER_HASH//\"}
printf "\n"

printf "Set btc address tx status: "
curl http://localhost:3000/apis/2gather/txs/${SET_BTC_HASH//\"}
printf "\n"

printf "Unset btc address tx status: "
curl http://localhost:3000/apis/2gather/txs/${UNSET_BTC_HASH//\"}
printf "\n"

printf "Set blacklist permission tx status: "
curl http://localhost:3000/apis/2gather/txs/${SET_BLACKLIST_HASH//\"}
printf "\n"

printf "Unset blacklist permission tx status: "
curl http://localhost:3000/apis/2gather/txs/${UNSET_BLACKLIST_HASH//\"}
printf "\n"

printf "Add subscription tx status: "
curl http://localhost:3000/apis/2gather/txs/${ADD_SUB_HASH//\"}
printf "\n"

printf "Remove subscription tx status: "
curl http://localhost:3000/apis/2gather/txs/${REMOVE_SUB_HASH//\"}
printf "\n"

printf "Add video tx status: "
curl http://localhost:3000/apis/2gather/txs/${ADD_VIDEO_HASH//\"}
printf "\n"

printf "Remove video tx status: "
curl http://localhost:3000/apis/2gather/txs/${REMOVE_VIDEO_HASH//\"}
printf "\n"

printf "Add video 2 tx status: "
curl http://localhost:3000/apis/2gather/txs/${ADD_VIDEO_HASH2//\"}
printf "\n"

printf "Remove video 2 tx status: "
curl http://localhost:3000/apis/2gather/txs/${REMOVE_VIDEO_HASH2//\"}
printf "\n"

printf "Flag video tx status: "
curl http://localhost:3000/apis/2gather/txs/${FLAG_VIDEO_HASH//\"}
printf "\n"

printf "Unflag video tx status: "
curl http://localhost:3000/apis/2gather/txs/${UNFLAG_VIDEO_HASH//\"}
printf "\n"

printf "Flag video 2 tx status: "
curl http://localhost:3000/apis/2gather/txs/${FLAG_VIDEO_HASH//\"}
printf "\n"

printf "Blacklist video tx status: "
curl http://localhost:3000/apis/2gather/txs/${BLACKLIST_VIDEO_HASH//\"}
printf "\n"

printf "Whitelist video tx status: "
curl http://localhost:3000/apis/2gather/txs/${WHITELIST_VIDEO_HASH//\"}
printf "\n"
