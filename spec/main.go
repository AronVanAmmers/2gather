package main

import (
	"./apitester"
	"fmt"
	// "path/filepath"
	"os"
	"math/rand"
)

const (
	VIDEO_NAME = "testvid"
	// VIDEO_FILE_NAME = "test.mp4"
	VIDEO_DATA = "Hahahahahaaaaaa"
)

// For making a random string for the username
var letters = []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
func randSeq(n int) string {
    b := make([]rune, n)
    for i := range b {
        b[i] = letters[rand.Intn(len(letters))]
    }
    return string(b)
}

func main() {
	host := os.Getenv("SERVER_HOST")
	//if host == "" {
		host = "http://localhost:3000/apis/2gather/"
	//}
	baseUrl := host
	videoName := VIDEO_NAME
	videoData := VIDEO_DATA
	userName := randSeq(28)
	fmt.Println("Base Url: " + baseUrl)
	fmt.Println("User Name: " + userName)
	fmt.Println("Video Data: " + videoData)
	tr := tester.NewTestRunner(baseUrl, userName, videoName, videoData)
	fmt.Println("Starting tests")
	tr.Start()
	fmt.Println("Tests successful")
	os.Exit(0)
}