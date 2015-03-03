package main

import (
	"./apitester"
	"fmt"
	// "path/filepath"
	"os"
)

const (
	USER_NAME = "tester"
	VIDEO_NAME = "testvid"
	// VIDEO_FILE_NAME = "test.mp4"
	VIDEO_DATA = "Hahahahahaaaaaa"
)

func main() {
	host := os.Getenv("SERVER_HOST")
	//if host == "" {
		host = "http://localhost:3000/apis/2gather/"
	//}
	baseUrl := host
	userName := USER_NAME
	videoName := VIDEO_NAME
	videoData := VIDEO_DATA
	fmt.Println("Base Url: " + baseUrl)
	fmt.Println("User Name: " + userName)
	fmt.Println("Video Data: " + videoData)
	tr := tester.NewTestRunner(baseUrl, userName, videoName, videoData)
	fmt.Println("Starting tests")
	tr.Start()
	fmt.Println("Tests successful")
	os.Exit(0)
}