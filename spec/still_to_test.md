## Resource: Session

* ~~(GET) {base-URL}/session~~


## Resource: User

* ~~(tx) (POST) {base-URL}/user~~
* ~~(GET) {base-URL}/user/:username~~
* (tx) (DELETE) {base-URL}/user/:username
* (tx) (PATCH) {base-URL}/user/username

### Resource: User.Subscriber

* (tx) (POST) {base-URL}/user/username/subs/
* (tx) (DELETE) {base-URL}/user/username/subs/subname
* (GET) {base-URL}/user/username/subs/subname

### Resource: User.Video

* ~~(tx) (POST) {base-URL}user/username/video~~
* (PATCH) {base-URL}/user/username/video/id
* (tx) (DELETE) {base-URL}/user/username/video/id
* (GET) {base-URL}/user/username/videos/ [NOTE: still to test with multiple videos per user]
* ~~(GET) {base-URL}/user/username/videos/id~~

### Resource Tx

* ~~(GET) {base-URL}/txs/thehash~~
