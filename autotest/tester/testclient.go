package tester

import (
	"fmt"
	"encoding/json"
	"strings"
	"net/http"
	"bytes"
	"io/ioutil"
)

var NULL_BYTES *bytes.Buffer = bytes.NewBuffer([]byte{})

type testClient struct {
	baseUrl string
	client  *http.Client
}

func NewTestClient(baseUrl string) *testClient {
	return &testClient{baseUrl, &http.Client{}}
}

func (tc *testClient) get(ep string) (resp *http.Response, err error) {

	p := tc.baseUrl + ep
	// fmt.Println("Sending GET request to: " + p)
	req, rErr := http.NewRequest("GET", p, NULL_BYTES)

	if rErr != nil {
		err = rErr
		return
	}

	rsp, dErr := tc.client.Do(req)

	if dErr != nil {
		err = dErr
		return
	}

	resp = rsp
	return
}

func (tc *testClient) pd(method, ep string, data []byte) (hash string, err error) {

	p := tc.baseUrl + ep
	fmt.Println("Sending " + method + " request to: " + p)
	req, rErr := http.NewRequest(method, p, bytes.NewBuffer(data))
	if rErr != nil {
		err = rErr
		return
	}
	resp, rErr := tc.client.Do(req)
	if rErr == nil && resp.StatusCode != 200 {
		err = fmt.Errorf("Request not successful. Status: %s\n", resp.Status)
		return
	}
	
	body, bErr := ioutil.ReadAll(resp.Body)
	defer resp.Body.Close()
	if bErr != nil {
		err = bErr;
		return
	}
	hash = strings.Trim(string(body), "\"")
	return
}

func (tc *testClient) pdJSON(method, ep string, obj interface{}) (hash string, err error) {
	bts, jErr := json.Marshal(obj)
	if jErr != nil {
		err = jErr
		return
	}
	hash, err = tc.pd(method, ep, bts)
	return
}

func (tc *testClient) post(ep string, data []byte) (hash string, err error) {
	tc.pd("POST",ep,data);
	return
}

func (tc *testClient) postJSON(ep string, obj interface{}) (hash string, err error) {
	hash, err = tc.pdJSON("POST", ep, obj);
	return
}

func (tc *testClient) delete(ep string, data []byte) (hash string, err error) {
	hash, err = tc.pd("DELETE",ep,data);
	return
}

func (tc *testClient) deleteJSON(ep string, obj interface{}) (hash string, err error) {
	tc.pdJSON("DELETE", ep, obj);
	return
}

func (tc *testClient) patchJSON(ep string, patches interface{}) (hashes []string, err error) {

	bts, jErr := json.Marshal(patches)
	if jErr != nil {
		fmt.Println("patch unmarshal failed: " + jErr.Error())
		err = jErr
		return
	}

	p := tc.baseUrl + ep
	fmt.Println("Sending PATCH request to: " + p)
	req, rErr := http.NewRequest("PATCH", p, bytes.NewBuffer(bts))
	if rErr != nil {
		err = rErr
		return
	}
	resp, rErr := tc.client.Do(req)
	if rErr == nil && resp.StatusCode != 200 {
		err = fmt.Errorf("Request not successful. Status: %s\n", resp.Status)
		return
	}
	
	body, bErr := ioutil.ReadAll(resp.Body)
	defer resp.Body.Close()
	if bErr != nil {
		err = bErr;
		return
	}
	
	ht := make([]string,0)
	err = json.Unmarshal(body, &ht)
	if err != nil {
		return
	}
	hashes = make([]string,0)
	for i := 0; i < len(ht);i++ {
		hashes = append(hashes, strings.Trim(ht[i], "\"") )	
	}
	
	return
}