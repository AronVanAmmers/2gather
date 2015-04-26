package tester

import (
	"fmt"
	"path"
	"io/ioutil"
	"encoding/json"
	"time"
	"os"
)

// Request bodies
type UserNameData struct {
	UserName string `json:"user_name"`
}

// Request bodies
type VideoData struct {
	Name string `json:"name"`
	Base64 string `json:"base64"`
}

type PatchString struct {
	Op string `json:"op"`
	Field string `json:"field"`
	Value string `json:"value"`
}

type PatchBool struct {
	Op string `json:"op"`
	Field string `json:"field"`
	Value bool `json:"value"`
}

// Return data

type User struct {
	UserName string `json:"user_name"`
	UserId string `json:"user_id"`
	Created string `json:"created"`
	BTCAddress string `json:"btc_address"`
	DougPerm bool `json:"doug_perm"`
	BlacklistPerm bool `json:"blacklist_perm"`
	Subscriptions []string `json:"subscriptions"`
	Videos []Video `json:"videos"`
}

type Video struct {
	Name string `json:"name"`
	Date string `json:"date"`
	Id string `json:"id"`
	Status string `json:"status"`
	Hash string `json:"hash"`
}

type testRunner struct {
	client   *testClient
	userName     string
	videoName string
	videoData string
	videoId string
}

func NewTestRunner(baseUrl, userName, videoName, videoData string) *testRunner {
	return &testRunner{NewTestClient(baseUrl), userName, videoName, videoData, ""}
}

func (tr *testRunner) Start() {
	tr.testSessionEmpty()
	tr.mining(true);
	tr.testCreateUser();
	tr.testSession();
	if os.Getenv("TESTNET") != "true" {
		tr.testBTCAddr()
	} else {
		fmt.Println("On Main Testnet; Skipping BTC test.")
	}
	if os.Getenv("TESTNET") != "true" {
		tr.testBlacklistPerm()
	} else {
		fmt.Println("On Main Testnet; Skipping Blacklist test.")
	}
	if os.Getenv("TESTNET") != "true" {
		tr.testAddSub();
	} else {
		fmt.Println("On Main Testnet; Skipping AddSub test.")
	}
	if os.Getenv("TESTNET") != "true" {
		tr.testRemoveSub();
	} else {
		fmt.Println("On Main Testnet; Skipping RmSub test.")
	}
	tr.testAddVideo();
	tr.testGetUsersVideos();
	tr.testGetVideo();
	if os.Getenv("TESTNET") != "true" {
		tr.testFlagVideo();
	} else {
		fmt.Println("On Main Testnet; Skipping Flag test.")
	}
	if os.Getenv("TESTNET") != "true" {
		tr.testBlacklistVideo();
	} else {
		fmt.Println("On Main Testnet; Skipping Blacklist Video test.")
	}
	if os.Getenv("TESTNET") != "true" {
		tr.testRemoveVideo();
	} else {
		fmt.Println("On Main Testnet; Skipping Remove Video test.")
	}
	tr.testRemoveUser();
	tr.mining(false)
}

func (tr *testRunner) poll(hash string) {
	NUM_IT := 200
	it := 0
	for it < NUM_IT {
		v := tr.pollOnce(hash)
		if v {
			return
		}
		time.Sleep(2 * time.Second)
		it++
	}
	fmt.Println("Failed: Tx polling timed out.")
	tr.abortTest()
}

func (tr *testRunner) pollOnce(hash string) bool {

	resp, err := tr.client.get(path.Join("txs", hash))
	if err != nil {
		fmt.Println("Error: Tx get failed")
		tr.abortTest()
	}
	body, err2 := ioutil.ReadAll(resp.Body)
	defer resp.Body.Close()
	if err2 != nil {
		fmt.Println("Error: Malformed response to get tx")
		tr.abortTest()
	}
	val := string(body)
	if val == "0" {
		fmt.Println("Error: Tx not added to thelonious tx queue.")
		tr.abortTest()
	} else if val == "1" {
		return false
	} else if val == "2" {
		fmt.Println("Error: Tx failed.")
		tr.abortTest()
	} else if val == "3" {
		return false
	} else if val == "4" {
		return true
	} else {
		fmt.Printf("Error: Unknown tx status code. %v\n",val)
		tr.abortTest()
	}
	return false
}

func (tr *testRunner) mining(val bool) {

	if val {
		fmt.Println("Testing: Mining 'on'.")
		_, err := tr.client.post("mining", []byte("on"))
		if err != nil {
			fmt.Println("Result: Mining 'on' failed: " + err.Error())
			os.Exit(1)
		}
		fmt.Println("Result: Mining 'on' succeeded.")
	} else {
		fmt.Println("Testing: Mining 'off'.")
		_, err := tr.client.post("mining", []byte("off"))
		if err != nil {
			fmt.Println("Result: Mining 'off' failed.")
			os.Exit(1)
		}
		fmt.Println("Result: Mining 'off' succeeded.")
	}
}

func (tr *testRunner) session() (ret *User, err error) {

	resp, err := tr.client.get("session")
	if err != nil {
		return
	}

	if resp.StatusCode != 200 {
		err = fmt.Errorf("Request not successful. Status: %s\n", resp.Status)
		return
	}

	body, _ := ioutil.ReadAll(resp.Body)
	usr := &User{}
	err = json.Unmarshal(body, usr)
	if err != nil {
		return
	}
	ret = usr
	defer resp.Body.Close()
	return
}

func (tr *testRunner) getUser(userName string) (ret *User, err error) {

	resp, err := tr.client.get("users/" + userName)
	if err != nil {
		return
	}

	if resp.StatusCode != 200 {
		err = fmt.Errorf("Request not successful. Status: %s\n", resp.Status)
		return
	}

	body, _ := ioutil.ReadAll(resp.Body)
	usr := &User{}
	err = json.Unmarshal(body, usr)
	if err != nil {
		return
	}
	ret = usr
	defer resp.Body.Close()
	return
}

func (tr *testRunner) testSessionEmpty() () {

	fmt.Println("Testing Session is Empty.")
	_, err := tr.session()
	if err == nil {
		fmt.Println("Test failed: Session not null.")
		return
	}
	fmt.Println("Result: Session Test Successful. No active session.");
}

func (tr *testRunner) testSession() () {

	fmt.Println("Testing Session is Populated.")
	usr, err := tr.session()
	if err != nil {
		fmt.Printf("Test failed: no active user was retrieved: %s", err)
		tr.abortTest()
	}
	if usr.UserName != tr.userName {
		fmt.Println("Test failed: User name '" + usr.UserName + "'. Expected: " + tr.userName)
		tr.abortTest()
	}
	fmt.Println("Result: Session Test Successful. Active user: " + usr.UserName);
}

func (tr *testRunner) testCreateUser() {
	fmt.Println("Testing: Create User")

	userData := &UserNameData{}
	userData.UserName = tr.userName

	hash, err := tr.client.postJSON("users", userData)

	if err != nil {
		fmt.Println("Result: Create User failed.")
		tr.abortTest()
	}

	fmt.Println("Tx passed: polling status.")
	tr.poll(hash)

	usr, uErr := tr.getUser(tr.userName)

	if uErr != nil {
		fmt.Println("Test failed: User data corrupted: " + uErr.Error())
		tr.abortTest()
	}

	if usr.UserName != tr.userName {
		fmt.Println("Test failed: User name '" + usr.UserName + "'. Expected: " + tr.userName)
		tr.abortTest()
	}
	fmt.Println("Test successful.");
}

func (tr *testRunner) testAddSub() {
	fmt.Println("Testing: Add subscription")

	userData := &UserNameData{}
	userData.UserName = tr.userName

	// Add the subscriber himself
	hash, err := tr.client.postJSON("users/" + tr.userName + "/subs", userData)

	if err != nil {
		fmt.Println("Result: Add subscription failed.")
		tr.abortTest()
	}

	fmt.Println("Tx passed: polling status.")
	tr.poll(hash)

	usr, uErr := tr.getUser(tr.userName)

	if uErr != nil {
		fmt.Println("Test failed: User data corrupted: " + uErr.Error())
		tr.abortTest()
	}

	if len(usr.Subscriptions) != 1 || usr.Subscriptions[0] != tr.userName {
		fmt.Println("Test failed: Subscription name: '" + usr.Subscriptions[0] + "'. Expected: " + tr.userName)
		tr.abortTest()
	}
	fmt.Println("Result: Add Subscription Test Successful.");
}


func (tr *testRunner) testRemoveSub() {
	fmt.Println("Testing: Add subscription")

	// Add the subscriber himself
	hash, err := tr.client.delete("users/" + tr.userName + "/subs/" + tr.userName, []byte{})

	if err != nil {
		fmt.Println("Result: Remove subscription failed.")
		tr.abortTest()
	}

	fmt.Println("Tx passed: polling status.")
	tr.poll(hash)

	usr, uErr := tr.getUser(tr.userName)

	if uErr != nil {
		fmt.Println("Test failed: User data corrupted: " + uErr.Error())
		tr.abortTest()
	}

	if len(usr.Subscriptions) != 0 {
		fmt.Println("Test failed: Subscription was not removed.")
		tr.abortTest()
	}
	fmt.Println("Result: Remove Subscription Test Successful.");
}

func (tr *testRunner) testAddVideo() {
	fmt.Println("Testing: Adding video.")

	videoData := &VideoData{}
	videoData.Name = tr.videoName
	videoData.Base64 = tr.videoData

	hash, err := tr.client.postJSON("users/" + tr.userName + "/videos", videoData)

	if err != nil {
		fmt.Println("Result: Add video failed.")
		tr.abortTest()
	}

	fmt.Println("Tx passed: polling status.")
	tr.poll(hash)

	usr, uErr := tr.getUser(tr.userName)

	if uErr != nil {
		fmt.Println("Test failed: User data corrupted: " + uErr.Error())
		tr.abortTest()
	}

	if usr.UserName != tr.userName {
		fmt.Println("Test failed: User name '" + usr.UserName + "'. Expected: " + tr.userName)
		tr.abortTest()
	}

	if len(usr.Videos) == 0 {
		fmt.Println("Test failed: No videos in user account.")
		tr.abortTest()
	}

	for i := 0; i < len(usr.Videos); i++ {
		if usr.Videos[i].Name == tr.videoName {
			tr.videoId = usr.Videos[i].Id
			fmt.Println("Test successful.");
			return;
		}
	}

	fmt.Println("Test Failed.");
	tr.abortTest();
}


func (tr *testRunner) testGetUsersVideos() {
	fmt.Println("Testing: Getting users videos.")

	vids, vErr := tr.client.get("users/" + tr.userName + "/videos")

	if vErr != nil {
		fmt.Println("Test failed: Video data corrupted: " + vErr.Error())
		tr.abortTest()
	}

	vidsBytes, err := ioutil.ReadAll(vids.Body)

	if err != nil {
		fmt.Println("Test failed: Could not read video data: " + err.Error())
		tr.abortTest()
	}

	videos := []Video{}
	err = json.Unmarshal(vidsBytes, &videos)

	if err != nil {
		fmt.Println("Test failed: Could not read video data: " + err.Error())
		tr.abortTest()
	}

	if len(videos) != 0 {
		if videos[0].Status == "0x01" {
			fmt.Println("Test successful.");
			return;
		}
	}

	fmt.Println("Test Failed.");
	tr.abortTest();
}

func (tr *testRunner) testGetVideo() {
	fmt.Println("Testing: Getting video.")

	usr, uErr := tr.getUser(tr.userName)

	if uErr != nil {
		fmt.Println("Test failed: User data corrupted: " + uErr.Error())
		tr.abortTest()
	}

	if len(usr.Videos) == 0 {
		fmt.Println("Test failed: No videos in user account.")
		tr.abortTest()
	}

	videoHash := usr.Videos[0].Hash
	hash, err := tr.client.get("videos/" + videoHash)

	if err != nil {
		fmt.Println("Result: Getting video failed.")
		tr.abortTest()
	}

	vid, err := ioutil.ReadAll(hash.Body)

	if err != nil {
		fmt.Println("Result: Getting video failed.")
		tr.abortTest()
	}

	if (string(vid) == tr.videoData) {
		fmt.Println("Test successful.")
		return
	}

	fmt.Println("Test Failed.");
	tr.abortTest();
}

func (tr *testRunner) testRemoveVideo() {
	fmt.Println("Testing: Remove Video")

	usr, uErr := tr.getUser(tr.userName);

	if uErr != nil {
		fmt.Println("Failed to fetch user, aborting.");
		tr.abortTest();
	}

	if len(usr.Videos) == 0 {
		fmt.Println("Test failed: No videos in user account.")
		tr.abortTest()
	}

	videoId := ""

	for i := 0; i < len(usr.Videos); i++ {
		if usr.Videos[i].Name == tr.videoName {
			videoId = usr.Videos[i].Id
		}
	}

	if videoId == "" {
		fmt.Println("Video not in user account.")
		tr.abortTest()
	}

	hash, err := tr.client.delete("users/" + tr.userName + "/videos/" + videoId, []byte{})

	if err != nil {
		fmt.Println("Result: Delete video failed.")
		tr.abortTest()
	}
	fmt.Println("Tx passed: polling status.")
	tr.poll(hash)

	time.Sleep(1*time.Second)

	usr , uErr = tr.getUser(tr.userName)

	if len(usr.Videos) != 0 {
		for i := 0; i < len(usr.Videos); i++ {
			if usr.Videos[i].Name == tr.videoName {
				fmt.Println("Result: Delete request successful but video still left.")
				tr.abortTest()
			}
		}
	}

	fmt.Println("Test successful.");
}

func (tr *testRunner) testRemoveUser() {
	fmt.Println("Testing: Remove User")

	hash, err := tr.client.delete("users/" + tr.userName, []byte{})

	if err != nil {
		fmt.Println("Result: Delete user failed.")
		tr.abortTest()
	}
	fmt.Println("Tx passed: polling status.")
	tr.poll(hash)

	time.Sleep(1*time.Second)

	_ , uErr := tr.getUser(tr.userName)

	if uErr == nil {
		fmt.Println("Test failed: User did not return 404: " + uErr.Error())
		tr.abortTest()
	}

	fmt.Println("Test successful.");
}

func (tr *testRunner) testBTCAddr() {
	fmt.Println("Testing: Set BTC address")

	patch := &PatchString{"replace", "btc_address","1EX63PVtDMRFt9om3hRMgw9Lkf7dQdEcXj"}
	patches := make([]*PatchString,0)
	patches = append(patches,patch)
	hashes, err := tr.client.patchJSON("users/" + tr.userName, patches)

	if err != nil {
		fmt.Println("Result: Add btc_address failed: " + err.Error())
		tr.abortTest()
	}

	fmt.Println("Tx passed: polling status.")
	tr.poll(hashes[0])

	time.Sleep(1*time.Second)

	usr , uErr := tr.getUser(tr.userName)

	if uErr != nil {
		fmt.Println("Test failed: Could not get user: " + uErr.Error())
		tr.abortTest()
	}
	fmt.Println("USER BTC: " + usr.BTCAddress)
	if usr.BTCAddress != "1EX63PVtDMRFt9om3hRMgw9Lkf7dQdEcXj" {
		fmt.Println("Test failed: BTC Address is: " + usr.BTCAddress )
		tr.abortTest()
	}
	fmt.Println("Set bitcoin-address was successful.");
}

func (tr *testRunner) testBlacklistPerm() {
	fmt.Println("Testing: Set Blacklisting Permissions")

	patch := &PatchBool{"replace", "blacklist_perm", true}
	patches := make([]*PatchBool,0)
	patches = append(patches,patch)
	hashes, err := tr.client.patchJSON("users/" + tr.userName, patches)

	if err != nil {
		fmt.Println("Result: Add blacklist perms failed: " + err.Error())
		tr.abortTest()
	}

	fmt.Println("Tx passed: polling status.")
	tr.poll(hashes[0])

	time.Sleep(1*time.Second)

	usr , uErr := tr.getUser(tr.userName)

	if uErr != nil {
		fmt.Println("Test failed: Could not get user: " + uErr.Error())
		tr.abortTest()
	}

	if usr.BlacklistPerm != true {
		fmt.Println("Test failed: Blacklisting permission was not set")
		tr.abortTest()
	}
	fmt.Println("Blacklisting permissions test was successful.");
}


func (tr *testRunner) testFlagVideo() {
	fmt.Println("Testing: Flag Video")

	patch := &PatchBool{"replace", "flag", true}
	patches := make([]*PatchBool,0)
	patches = append(patches,patch)
	hashes, err := tr.client.patchJSON("users/" + tr.userName + "/videos/" + tr.videoId, patches)

	if err != nil {
		fmt.Println("Result: Flag failed: " + err.Error())
		tr.abortTest()
	}

	fmt.Println("Tx passed: polling status.")
	tr.poll(hashes[0])

	time.Sleep(1*time.Second)

	usr , uErr := tr.getUser(tr.userName)

	if uErr != nil {
		fmt.Println("Test failed: Could not get user: " + uErr.Error())
		tr.abortTest()
	}

	if usr.BlacklistPerm != true {
		fmt.Println("Test failed: Flagging was not done.")
		tr.abortTest()
	}
	fmt.Println("Flagging test was successful.");
}

func (tr *testRunner) testBlacklistVideo() {
	fmt.Println("Testing: Blacklist Video")

	patch := &PatchBool{"replace", "blacklist", true}
	patches := make([]*PatchBool,0)
	patches = append(patches,patch)
	hashes, err := tr.client.patchJSON("users/" + tr.userName + "/videos/" + tr.videoId, patches)

	if err != nil {
		fmt.Println("Result: Blacklist failed: " + err.Error())
		tr.abortTest()
	}

	fmt.Println("Tx passed: polling status.")
	tr.poll(hashes[0])

	time.Sleep(1*time.Second)

	usr , uErr := tr.getUser(tr.userName)

	if uErr != nil {
		fmt.Println("Test failed: Could not get user: " + uErr.Error())
		tr.abortTest()
	}

	if usr.BlacklistPerm != true {
		fmt.Println("Test failed: Blacklisting was not done.")
		tr.abortTest()
	}
	fmt.Println("Blacklisting test was successful.");
}
func (tr *testRunner) abortTest() {
	fmt.Println("A test has failed. Turning off miner and exiting.")
	tr.mining(false)
	os.Exit(1)
}