package main

import (
	"./tester"
	"fmt"
	// "path/filepath"
	"os"
)

const (
	USER_NAME = "tester"
	VIDEO_NAME = "testvid"
	// VIDEO_FILE_NAME = "test.mp4"
	VIDEO_FILE_NAME = "autotest/test.mp4"
)

func main() {
	host := os.Getenv("SERVER_HOST")
	//if host == "" {
		host = "http://localhost:3000/apis/2gather/"
	//}
	baseUrl := host
	userName := USER_NAME
	videoName := VIDEO_NAME
	videoFileName := VIDEO_FILE_NAME
	fmt.Println("Base Url: " + baseUrl)
	fmt.Println("User Name: " + userName)
	fmt.Println("Video Filename: " + videoFileName)
	// filePath, _ := filepath.Abs(videoFileName)
	filePath := videoFileName
	fmt.Println("Video file path: " + filePath)
	tr := tester.NewTestRunner(baseUrl, userName, videoName, filePath)
	fmt.Println("Starting tests")
	tr.Start()
	fmt.Println("Tests successful")
	os.Exit(0)
}