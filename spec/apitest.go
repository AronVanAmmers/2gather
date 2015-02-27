package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"path"
	"reflect"
	"strings"
	"time"
)

var NULL_BYTES *bytes.Buffer = bytes.NewBuffer([]byte{})

type Config struct {
	UserName string `json:"user_name"`
	VideoUrl string `json:"video_url"`
	VideoName string `json:"video_name"`
	FastFail bool   `json:"fast_fail"`
}

type User struct {
	UserName      string   `json:"user_name"`
	UserId        string   `json:"user_id"`
	Created       string   `json:"created"`
	BTCAddress    string   `json:"btc_address"`
	DougPerm      bool     `json:"doug_perm"`
	BlacklistPerm bool     `json:"blacklist_perm"`
	Subscriptions []string `json:"subscriptions"`
	Videos        []Video  `json:"videos"`
}

type Video struct {
	Date      string `json:"date"`
	VideoName string `json:"name"`
	Status    string `json:"status"`
	VideoNumber string `json:"vidnum"`
	VideoUrl  struct {
		UrlData        string `json:"Data"`
		UrlError       string `json:"Error"`
		UrlStatus      int `json:"Status"`
	} `json:"url"`
}

type testClient struct {
	baseUrl string
	client  *http.Client
}

type testRunner struct {
	client   *testClient
	user     string
	videoUrl string
	videoName string
	fastFail bool
}

// -----------------------------------------------------------
// ---------------------HTTPREQ FUNCTIONS---------------------
// -----------------------------------------------------------
func NewTestClient(baseUrl string) *testClient {
	return &testClient{baseUrl, &http.Client{}}
}

func (tc *testClient) get(ep string) (resp *http.Response, err error) {

	p := tc.baseUrl + ep
	fmt.Println("[REQUEST]\tSending GET request to: " + p)
	req, rErr := http.NewRequest("GET", p, NULL_BYTES)
	if rErr != nil {
		err = rErr
		return
	}
	rsp, dErr := tc.client.Do(req)
	if dErr != nil {
		err = fmt.Errorf("[REQUEST]\tRequest not successful. Status: %s\n", dErr)
		return
	}

	resp = rsp
	return
}

func (tc *testClient) post(ep string, data []byte) (resp *http.Response, err error) {

	p := tc.baseUrl + ep
	fmt.Println("[REQUEST]\tSending POST request to: " + p)
	req, rErr := http.NewRequest("POST", p, bytes.NewBuffer(data))
	if rErr != nil {
		err = rErr
		return
	}
	resp, err = tc.client.Do(req)
	if err == nil && resp.StatusCode != 200 {
		err = fmt.Errorf("[REQUEST]\tRequest not successful. Status: %s\n", resp.Status)
		resp = nil
		return
	}
	return
}

func (tc *testClient) postJSON(ep string, obj interface{}) (hash string, err error) {
	bts, jErr := json.Marshal(obj)
	if jErr != nil {
		err = jErr
		return
	}
	resp, rErr := tc.post(ep, bts)
	if rErr != nil {
		err = rErr
		return
	}
	body, _ := ioutil.ReadAll(resp.Body)
	defer resp.Body.Close()
	hash = strings.Trim(string(body), "\"")
	return
}


func (tc *testClient) patch(ep string, data []byte) (resp *http.Response, err error) {

	p := tc.baseUrl + ep
	fmt.Println("[REQUEST]\tSending PATCH request to: " + p)
	req, rErr := http.NewRequest("PATCH", p, bytes.NewBuffer(data))
	if rErr != nil {
		err = rErr
		return
	}
	resp, err = tc.client.Do(req)
	if err == nil && resp.StatusCode != 200 {
		err = fmt.Errorf("[REQUEST]\tRequest not successful. Status: %s\n", resp.Status)
		resp = nil
		return
	}
	return
}

func (tc *testClient) patchJSON(ep string, obj interface{}) (hash string, err error) {
	bts, jErr := json.Marshal(obj)
	if jErr != nil {
		err = jErr
		return
	}
	resp, rErr := tc.patch(ep, bts)
	if rErr != nil {
		err = rErr
		return
	}
	body, _ := ioutil.ReadAll(resp.Body)
	defer resp.Body.Close()
	hash = strings.Trim(string(body), "\"")
	return
}


func (tc *testClient) delete(ep string, data []byte) (resp *http.Response, err error) {

	p := tc.baseUrl + ep
	fmt.Println("[REQUEST]\tSending DELETE request to: " + p)
	req, rErr := http.NewRequest("DELETE", p, bytes.NewBuffer(data))
	if rErr != nil {
		err = rErr
		return
	}
	resp, err = tc.client.Do(req)
	if err == nil && resp.StatusCode != 200 {
		err = fmt.Errorf("[REQUEST]\tRequest not successful. Status: %s\n", resp.Status)
		resp = nil
		return
	}
	return
}

func (tc *testClient) deleteJSON(ep string, obj interface{}) (hash string, err error) {
	bts, jErr := json.Marshal(obj)
	if jErr != nil {
		err = jErr
		return
	}
	resp, rErr := tc.delete(ep, bts)
	if rErr != nil {
		err = rErr
		return
	}
	body, _ := ioutil.ReadAll(resp.Body)
	defer resp.Body.Close()
	hash = strings.Trim(string(body), "\"")
	return
}

// -----------------------------------------------------------
// ---------------------RUNNER FUNCTIONS----------------------
// -----------------------------------------------------------
func NewTestRunner(baseUrl, userName, videoUrl string, videoName string, fastFail bool) *testRunner {
	return &testRunner{NewTestClient(baseUrl), userName, videoUrl, videoName, fastFail}
}

// -----------------------------------------------------------
// ---------------------UTILITY FUNCTIONS---------------------
// -----------------------------------------------------------
func (tr *testRunner) poll(hash string) (err error) {
	NUM_IT := 15
	it := 0
	for it < NUM_IT {
		v := tr.pollOnce(hash)
		if v {
			return nil
		}
		time.Sleep(2 * time.Second)
		it++
	}
	fmt.Println("[TEST-RUNNER]\tFailed: Tx polling timed out.")
	err = fmt.Errorf("[TEST-RUNNER]\tFailed: Tx polling timed out.")
	return
}

func (tr *testRunner) pollOnce(hash string) bool {
	fmt.Printf("[TEST-RUNNER]\tPolling tx: %s\n", hash)
	resp, err := tr.client.get(path.Join("txs", hash))
	if err != nil {
		fmt.Println("[RETURN]\tError: Tx get failed")
		abortTest(tr)
	}
	body, err2 := ioutil.ReadAll(resp.Body)
	defer resp.Body.Close()
	if err2 != nil {
		fmt.Println("[RETURN]\tError: Malformed response to get tx")
		abortTest(tr)
	}
	val := string(body)
	if val == "0" {
		fmt.Println("[RETURN]\tError: Tx not added to thelonious tx queue.")
		abortTest(tr)
	} else if val == "1" {
		return false
	} else if val == "2" {
		fmt.Println("[RETURN]\tError: Tx failed.")
		abortTest(tr)
	} else if val == "3" {
		return true
	} else {
		fmt.Println("[RETURN]\tError: Unknown tx status code.")
		abortTest(tr)
	}
	return false
}

func (tr *testRunner) mining(val bool) {

	if val {
		fmt.Println("[TEST-RUNNER]\tTesting: Mining 'on'.")
		_, err := tr.client.post("mining", []byte("on"))
		if err != nil {
			fmt.Println("[RETURN]\tResult: Mining 'on' failed: " + err.Error())
			os.Exit(1)
		}
		fmt.Println("[RETURN]\tResult: Mining 'on' succeeded.")
	} else {
		fmt.Println("[TEST-RUNNER]\tTesting: Mining 'off'.")
		_, err := tr.client.post("mining", []byte("off"))
		if err != nil {
			fmt.Println("[RETURN]\tResult: Mining 'off' failed.")
			os.Exit(1)
		}
		fmt.Println("[RETURN]\tResult: Mining 'off' succeeded.")
	}
}

func (tr *testRunner) inspect(name string, m interface{}) {

	s := reflect.ValueOf(m)
	typeOfT := s.Type()

	if typeOfT.Kind() == reflect.Ptr {
		typeOfT = typeOfT.Elem()
	}

	for i := 0; i < s.Elem().NumField(); i++ {
		f := s.Elem().Field(i)
		tr.inspectPrinter(name, fmt.Sprintf("%s", typeOfT.Field(i).Name), fmt.Sprintf("%s", f.Type()), fmt.Sprintf("%v", f.Interface()))
	}

}

func (tr *testRunner) inspectPrinter(a, b, c, d string) {
	if( len(b) >= 9 ) {
		if( len(c) >= 9 ) {
			fmt.Printf("[INSPECTOR]\tFields for: %s\tField: %s\tType: %v\tValue: %v\n", a, b, c, d)
		} else {
			fmt.Printf("[INSPECTOR]\tFields for: %s\tField: %s\tType: %v\t\tValue: %v\n", a, b, c, d)
		}
	} else {
		if( len(c) >= 9 ) {
			fmt.Printf("[INSPECTOR]\tFields for: %s\tField: %s\t\tType: %v\tValue: %v\n", a, b, c, d)
		} else {
			fmt.Printf("[INSPECTOR]\tFields for: %s\tField: %s\t\tType: %v\t\tValue: %v\n", a, b, c, d)
		}
	}
}

// -----------------------------------------------------------
// -----------------------SESSION FUNCTIONS-------------------
// -----------------------------------------------------------
func (tr *testRunner) getSession() (ret *User, err error) {
	usr := &User{}
	resp, err := tr.client.get("session")
	if err != nil {
		err = fmt.Errorf("[RESPONSE]\tError from backend. Error: %s\n", err)
		return
	}

	if resp.StatusCode != 200 {
		fmt.Println("[TEST-RUNNER]\tRetrying.")
		resp, err := tr.client.get("session")
		if err != nil {
			err = fmt.Errorf("[RESPONSE]\tError from backend. Error: %s\n", err)
			return usr, err
		}
		if resp.StatusCode != 200 {
			err = fmt.Errorf("[RESPONSE]\tError from backend. Status: %s\n", resp.Status)
			return usr, err
		}
	}

	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Printf("[RETURN]\tSession info currently looks like this: %s\n", body)
	err = json.Unmarshal(body, usr)
	tr.inspect("Session", usr)

	if err != nil {
		fmt.Printf("[TEST-RUNNER]\tUnable to unmarshall return into the proper data type. Error: %s\n", err)
		return
	}

	ret = usr
	defer resp.Body.Close()
	return
}

// -----------------------------------------------------------
// -----------------------USER FUNCTIONS----------------------
// -----------------------------------------------------------
func (tr *testRunner) getUser(userName string) (ret *User, err error) {

	usr := &User{}
	resp, err := tr.client.get("user/" + userName)
	if err != nil {
		err = fmt.Errorf("[RESPONSE]\tError from backend. Error: %s\n", err)
		return
	}

	if resp.StatusCode != 200 {
		fmt.Println("[TEST-RUNNER]\tRetrying.")
		resp, err := tr.client.get("user/" + userName)
		if err != nil {
			err = fmt.Errorf("[RESPONSE]\tError from backend. Error: %s\n", err)
			return usr, err
		}
		if resp.StatusCode != 200 {
			err = fmt.Errorf("[RESPONSE]\tError from backend. Status: %s\n", resp.Status)
			return usr, err
		}
	}

	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Printf("[RETURN]\tUser info currently looks like this: %s\n", body)
	err = json.Unmarshal(body, usr)
	tr.inspect("User", usr)

	if err != nil {
		fmt.Printf("[TEST-RUNNER]\tUnable to unmarshall return into the proper data type. Error: %s\n", err)
		return
	}
	ret = usr
	defer resp.Body.Close()
	return
}

func (tr *testRunner) createUser(resetAlready bool) {
	fmt.Println("[TEST-RUNNER]\tTesting: Create User")

	userData := make(map[string]interface{})
	userData["user_name"] = tr.user

	hash, err := tr.client.postJSON("user", userData)

	if err != nil {
		fmt.Println("[RETURN]\tResult: Create User failed.")
		abortTest(tr)
	}

	if( len(hash) <= 60 ) {
		fmt.Printf("[TEST-RUNNER]\tTransactionID invalid: %v. Restarting Test.\n", hash)
		if resetAlready {
			fmt.Println("[TEST-MASTER]\tNo You're not.")
			abortTest(tr)
		} else {
			tr.createUser(true)
		}
	}

	fmt.Println("[TEST-RUNNER]\tTx passed: polling status.")
	err = tr.poll(hash)
	if err != nil {
		fmt.Println("[TEST-RUNNER]\tPolling: Timed Out. Restarting.")
		if resetAlready {
			fmt.Println("[TEST-MASTER]\tNo you're not.")
			abortTest(tr)
		} else {
			tr.createUser(true)
		}
	}
	time.Sleep(3 * time.Second)

	usr, uErr := tr.getUser(tr.user)

	if uErr != nil {
		fmt.Printf("[TEST-RUNNER]\tTest failed: User data corrupted: %v\n", uErr.Error())
		fmt.Println("[TEST-RUNNER]\tRetrying the test.")
		if resetAlready {
			fmt.Println("[TEST-MASTER]\tNo you're not.")
			abortTest(tr)
		} else {
			tr.createUser(true)
		}
	}

	if usr.UserName != tr.user {
		fmt.Println("[TEST-RUNNER]\tTest failed: UserName Got: <" + usr.UserName + ">. Expected: <" + tr.user + ">.")
		fmt.Println("[TEST-RUNNER]\tRetrying the test.")
		if resetAlready {
			fmt.Println("[TEST-MASTER]\tNo you're not.")
			abortTest(tr)
		} else {
			tr.createUser(true)
		}
	}
	fmt.Println("[TEST-RUNNER]\tTest successful.")
}

func (tr *testRunner) updateUser(resetAlready bool) {
	fmt.Println("[TEST-RUNNER]\tTesting: Patch (update) User")

	ud := make(map[string]string)
	userData := []map[string]string{ud}
	userData[0]["blacklist_perm"] = "replace"

	url := "user/" + tr.user
	hash, err := tr.client.patchJSON(url, userData)

	if err != nil {
		fmt.Println("[RETURN]\tResult: Update User failed.")
		abortTest(tr)
	}

	if( len(hash) <= 60 ) {
		fmt.Printf("[TEST-RUNNER]\tTransactionID invalid: %v. Restarting Test.\n", hash)
		if resetAlready {
			fmt.Println("[TEST-MASTER]\tNo You're not.")
			abortTest(tr)
		} else {
			tr.updateUser(true)
		}
	}

	fmt.Println("[TEST-RUNNER]\tTx passed: polling status.")
	err = tr.poll(hash)
	if err != nil {
		fmt.Println("[TEST-RUNNER]\tPolling: Timed Out. Restarting.")
		if resetAlready {
			fmt.Println("[TEST-MASTER]\tNo you're not.")
			abortTest(tr)
		} else {
			tr.updateUser(true)
		}
	}
	time.Sleep(3 * time.Second)

	usr, uErr := tr.getUser(tr.user)

	if uErr != nil {
		fmt.Printf("[TEST-RUNNER]\tTest failed: User data corrupted: %v\n", uErr.Error())
		fmt.Println("[TEST-RUNNER]\tRetrying the test.")
		if resetAlready {
			fmt.Println("[TEST-MASTER]\tNo you're not.")
			abortTest(tr)
		} else {
			tr.updateUser(true)
		}
	}

	if usr.UserName != tr.user {
		fmt.Println("[TEST-RUNNER]\tTest failed: User name '" + usr.UserName + "'. Expected: " + tr.user)
		fmt.Println("[TEST-RUNNER]\tRetrying the test.")
		if resetAlready {
			fmt.Println("[TEST-MASTER]\tNo you're not.")
			abortTest(tr)
		} else {
			tr.updateUser(true)
		}
	}
	fmt.Println("[TEST-RUNNER]\tTest successful.")
}

func (tr *testRunner) deleteUser(resetAlready bool) {
	fmt.Println("[TEST-RUNNER]\tTesting: Delete User")

	userData := make(map[string]interface{})
	userData["user_name"] = tr.user

	url := "user/" + tr.user
	hash, err := tr.client.deleteJSON(url, userData)
	if err != nil {
		fmt.Println("[RETURN]\tResult: Update User failed.")
		abortTest(tr)
	}

	if( len(hash) <= 60 ) {
		fmt.Printf("[TEST-RUNNER]\tTransactionID invalid: %v. Restarting Test.\n", hash)
		if resetAlready {
			fmt.Println("[TEST-MASTER]\tNo You're not.")
			abortTest(tr)
		} else {
			tr.deleteUser(true)
		}
	}

	fmt.Println("[TEST-RUNNER]\tTx passed: polling status.")
	err = tr.poll(hash)
	if err != nil {
		fmt.Println("[TEST-RUNNER]\tPolling: Timed Out. Restarting.")
		if resetAlready {
			fmt.Println("[TEST-MASTER]\tNo you're not.")
			abortTest(tr)
		} else {
			tr.deleteUser(true)
		}
	}
	time.Sleep(3 * time.Second)

	usr, uErr := tr.getSession()

	// this should 404
	fmt.Printf("%s", uErr)
	if uErr == nil {
		fmt.Printf("[TEST-RUNNER]\tTest failed: User not deleted.")
		fmt.Println("[TEST-RUNNER]\tRetrying the test.")
		if resetAlready {
			fmt.Println("[TEST-MASTER]\tNo you're not.")
			abortTest(tr)
		} else {
			tr.deleteUser(true)
		}
	}

	if usr.UserName != "" {
		fmt.Println("[TEST-RUNNER]\tTest failed: User name <" + usr.UserName + ">. Expected: <NIL>")
		fmt.Println("[TEST-RUNNER]\tRetrying the test.")
		if resetAlready {
			fmt.Println("[TEST-MASTER]\tNo you're not.")
			abortTest(tr)
		} else {
			tr.deleteUser(true)
		}
	}
	fmt.Println("[TEST-RUNNER]\tTest successful.")
}

func (tr *testRunner) setBTCAddr() {

}

// -----------------------------------------------------------
// -----------------------VIDEO FUNCTIONS---------------------
// -----------------------------------------------------------
func (tr *testRunner) getVideo(userName string, videoNumber string) (ret *Video, err error) {

	vid := &Video{}
	resp, err := tr.client.get("user/" + userName + "/videos/" + videoNumber)
	if err != nil {
		err = fmt.Errorf("[RESPONSE]\tError from backend. Error: %s\n", err)
		return
	}

	if resp.StatusCode != 200 {
		fmt.Println("[TEST-RUNNER]\tThe tests failed. Trying again.")
		resp, err := tr.client.get("user/" + userName + "/videos/" + videoNumber)
		if err != nil {
			err = fmt.Errorf("[RESPONSE]\tError from backend. Error: %s\n", err)
			return vid, err
		}
		if resp.StatusCode != 200 {
			err = fmt.Errorf("[REQUEST]\tRequest not successful. Status: %s\n", resp.Status)
			return vid, err
		}
	}

	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Printf("[RETURN]\tVideo info currently looks like this: %s\n", body)
	err = json.Unmarshal(body, vid)
	tr.inspect("Video", vid)

	if err != nil {
		fmt.Printf("[TEST-RUNNER]\tUnable to unmarshall return into the proper data type. Error: %s\n", err)
		return
	}
	ret = vid
	defer resp.Body.Close()
	return
}

func (tr *testRunner) createVideo(resetAlready bool) {
	fmt.Println("[TEST-RUNNER]\tTesting: Create Video")

	videoData := make(map[string]interface{})
	videoData["name"] = tr.videoName
	videoData["url"] = tr.videoUrl

	url := "user/" + tr.user + "/videos"
	hash, err := tr.client.postJSON(url, videoData)

	if err != nil {
		fmt.Println("[RETURN]\tResult: Create Video failed.")
		abortTest(tr)
	}

	if( len(hash) <= 60 ) {
		fmt.Printf("[TEST-RUNNER]\tTransactionID invalid: %v. Restarting Test.\n", hash)
		if resetAlready {
			fmt.Println("[TEST-MASTER]\tNo You're not.")
			abortTest(tr)
		} else {
			tr.createVideo(true)
		}
	}

	fmt.Println("[RETURN]\tTx passed: polling status.")
	err = tr.poll(hash)
	if err != nil {
		fmt.Println("[TEST-RUNNER]\tPolling: Timed Out. Restarting Test.")
		if resetAlready {
			fmt.Println("[TEST-MASTER]\tNo You're not.")
			abortTest(tr)
		} else {
			tr.createVideo(true)
		}
	}
	time.Sleep(3 * time.Second)

	vid, vErr := tr.getVideo(tr.user, "0x1")

	if vErr != nil {
		fmt.Printf("[TEST-RUNNER]\tTest failed: Video data corrupted: %v\n", vErr.Error())
		fmt.Println("[TEST-RUNNER]\tRetrying the test.")
		if resetAlready {
			fmt.Println("[TEST-MASTER]\tNo You're not.")
			abortTest(tr)
		} else {
			tr.createVideo(true)
		}
	}

	if vid.VideoName != tr.videoName {
		fmt.Println("[TEST-RUNNER]\tTest failed: Wrong Video name: Got: <" + vid.VideoName + ">. Expected: <" + tr.videoName + ">.")
		fmt.Println("[TEST-RUNNER]\tRetrying the test.")
		if resetAlready {
			fmt.Println("[TEST-MASTER]\tNo You're not.")
			abortTest(tr)
		} else {
			tr.createVideo(true)
		}
	}
	fmt.Println("[TEST-RUNNER]\tTest successful.")
}

// -----------------------------------------------------------
// ---------------------MASTER FUNCTIONS----------------------
// -----------------------------------------------------------
func (tr *testRunner) start() {
	// turn on miner
	tr.mining(true)
	time.Sleep(5 * time.Second)

	// -------TESTS-----------
	//
	// all tests have true false value
	// this is for reseting the tests
	// sometimes the chains get wonky
	// this will allow for retries,
	// just as a user would do.
	//
	// to test absolutely without a retry
	// turn the tests to be passed a true
	// value instead of current default
	// of false.
	//
	// tests sessions and user return
	tr.getSession()
	// tests post new user
	// tests get user by id
	tr.createUser(false)
	// tests delete username
	tr.deleteUser(false)
	// reset to username
	tr.createUser(false)
	// tests patch (update) user
	// tr.updateUser(false) // TODO - fix this (have to refactor the postJSON function)
	// tests post new video
	// tests get video by username and video nonce
	tr.createVideo(false)

	// turn off mining
	time.Sleep(5 * time.Second)
	tr.mining(false)
}

func main() {
	cfg := loadConfig()

	host := os.Getenv("SERVER_HOST")
	host = "http://localhost:3000/apis/2gather/"
	baseUrl := host
	tr := NewTestRunner(baseUrl, cfg.UserName, cfg.VideoUrl, cfg.VideoName, cfg.FastFail)
	fmt.Println("-------------------------------------------------")
	fmt.Printf("[TEST-MASTER]\t(Base Url)\t%v\n", tr.client.baseUrl)
	fmt.Printf("[TEST-MASTER]\t(User Name)\t%v\n", tr.user)
	fmt.Printf("[TEST-MASTER]\t(Video Url)\t%v\n", tr.videoUrl)
	fmt.Printf("[TEST-MASTER]\t(Video Name)\t%v\n", tr.videoName)
	fmt.Printf("[TEST-MASTER]\t(Fast fail)\t%v\n", tr.fastFail)
	fmt.Println("-------------------------------------------------")
	fmt.Println("[TEST-MASTER]\tStarting tests")
	tr.start()
	fmt.Println("[TEST-MASTER]\tTests successful")
	os.Exit(0)
}

func loadConfig() *Config {
	bts, err := ioutil.ReadFile("spec/tests_config.json")
	if err != nil {
		fmt.Println("[TESTS-SETUP]\tConfig file unreadable.")
		os.Exit(1)
	}
	cfg := &Config{}
	jErr := json.Unmarshal(bts, cfg)
	if jErr != nil {
		fmt.Println("[TESTS-SETUP]\tConfig file malformed")
		os.Exit(1)
	}
	return cfg
}

func abortTest(tr *testRunner) {
	fmt.Println("[TEST-MASTER]\tA test has failed.")
	tr.mining(false)
	// todo: fast fail paradigm
	os.Exit(1)
}
