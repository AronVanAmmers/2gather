## 2gather - API Specification

**DISCLAIMER** (the lawyers talk): The real purpose of this dapp, or at least the initial release, is to test decerver module inter-op, and to show the potential of the platform. Eris Industries **has no intention** of commoditizing this DApp, or of ensuring that this DApp stays as a production worthy application. This DApp has been built as a proof of platform as well as to provide a base hierarchical document structure for other DApp makers to see how we think these various new and experimental systems can work together in harmony.

### UI -- UPDATES

**NOTE**: Mine has been added. endpoint is `BASE_URL/mining`

Just send an http POST request with ‘on’ or ‘off’ in the body, plain text for now. No JSON is read or required to turn mining (committing) on or off.

### UI Introduction

This is what the UI does for now:

* When it loads it checks the user account on the blockchain. If the user has no account it should ask if he wants to make one. (this happens by sending an ‘Init’ request from the UI when the page is loaded)
* When the user is found, it should display some basic info about him, such as the user name, the list of his posted videos, and a list of the active subscriptions.
* When the user clicks on one of his subscriptions, it should switch to that users page instead of his own, where it shows that users videos and subs, etc.
* There should also be a video player somewhere, that shows the video, the name of the video, the name of the user that posted the video (this should be a link to their site), and a link that allows the viewer to tip the video poster in bitcoin.

Notable differences from actual [youtube](https://youtube.com):

* There is no starting page with popular videos or something like that. It’s just the user account and his own videos/subs.
* There is no way to search for videos.

### UI Layout

Channel page:

* `Public side`: List of videos you have posted
* `Private side`: Channel administrative stuff (set BTC etc)
* Search for username

Subscriptions page:

* Displays recent vids from your subs

Lots of flexibilty here regarding precise design.

## API Specification -- General

`Request` format: RESTful service (`GET` and `DELETE` only url and query params (no body); `POST`, `PATCH`, and `PUT` requests require a json body).

`Response` format: JSON body.

### API -- RESTful Resources

There are two resources used in the 2gather API.

`User Resource`: has

* one channel,
* one username,
* one bitcoin address (optional),
* one or more videos,
* one or more subscriptions.

`Video Resource`: has

* one channel,
* one video name,
* one video url

### API Calls -- Base URL

This is a list of useful API calls.

`{base-URL}` is, by default `http://localhost:3000/apis/2gather`. If you are running a [Decerver](https://decerver.io/tutuorials) not on localhost then you would replace with the proper `IPaddress:PORT` combination for wherever you were running your Decerver.

### API Calls Which Require Blockchain Transactions

When it comes to actions that requires a blockchain transaction (the entire API specification, except for `GET` operations), it will return a transaction hash which can be used for polling.

**Note** that all api calls with the flag (tx) include transactions to the blockchain, which means all you get back from the call is a transaction hash. To check whether or not this transaction succeeds, it needs to be tracked. The way we do it with websockets is normally by storing the hash and subscribing to transaction events from the thelonious (monk) module. The tx will trigger either a tx or a tx:failed event, and when that happens it’s sent back over the socket. For more information on how we do this, see the `autotest/tester/testrunner.go`, especially the `poll` and `pollOnce` functions.

With http you get the tx hash when making a request that ends in a transaction. This hash can be used when polling to see if the tx has been processed.

If the action requires a tx, the request outlined below will have a `(tx)` after the end point, like in `POST` user. If nothing else is specified, the body of the response will contain only the hash as a hexstring (prepended by 0x).

### API Calls Using HTTP PATCH Command

`Patches` should have this format:

Patch:

```javascript
{
  "op": String,
  "field": String,
  "value": // depends on the field
}
```

The `op`s allowed are: `replace` and `remove`.

## API Specification -- Specifics

### Resource: session

#### GET `{base-URL}/session`

Retrieves user data of the currently active address. Will `404` if no user account is tied to the address.

Response body:

```javascript
{
  "user_name": String,
  "channel_id": String,
  "created": String,
  "btc_address": String,
  "doug_perm": Bool,
  "blacklist_perm": Bool,
  "videos": [ String … ], // (an array of video identifiers, see below for specifics)
  "subscribers": [ String … ] // (an array of user names) <-- this is really what the current_user `subscribes` to.
}
```

### Resource: user

#### POST `{base-URL}/user` (tx)

Creates a new user account. This will create an account and let the current post/remove videos, and add/remove subscriptions.

Request Body:

```javascript
{
	"user_name": String
}
```

#### DELETE `{base-URL}/user/:username` (tx)

Deletes a user account. The account has to be tied to the user's currently used address. If trying to remove some other users account the contracts will not allow and the call to the API will fail.

**Note**, The API endpoint currently requires a username in case we add the possibility for admins to remove other users later.

#### GET `{base-URL}/user/:username`

Retrieves user data. Somewhat overlaps with `session` data in how the response body is structured, but this call allows for retrieval of any user's information while the `session` GET only allows the current user to retrieve their own information.

```javascript
{
  "user_name": String,
  "channel_id": String,
  "created": String,
  "btc_address": String,
  "doug_perm": Bool,
  "blacklist_perm": Bool,
  "videos": [ String … ], // (an array of video identifiers, see below for specifics)
  "subscribers": [ String … ] // (an array of user names) <-- this is really what the current_user `subscribes` to.
}
```

#### (PATCH) `{base-URL}/user/:username` (tx)

Modify a user. A user can only modify the account tied to their thelonious address. Any attempt to modify someone else’s address will fail.

The body for the request **must be structured** as above in the PATCH discussion section. The response will return a `tx` object for tracking.

Fields available to PATCH for the `user` resource:

* `btc_addr` String (bitcoin address)
* `doug_perm` Boolean
* `blacklist_perm ` Boolean

To set doug or blacklist permissions for a user, just send a ‘replace’ OP. It will only set it to true.

To remove the permission send a ‘remove’ OP.

### Resource: user.subscriber

#### POST `{base-URL}/user/:username/subs/` (tx)

Subscribes to another user.

Request Body:

```javascript
{
	"user_name": String
}
```

#### DELETE `{base-URL}/user/:username/subs/:subname` (tx)

This causes the active user to unsubscribe to the target user. The target must be subscribed to by the active user or it will fail.

### Resource: user.video

#### POST `{base-URL}user/:username/video` (tx)

Uploads a video.

Request Body:

```javascript
{
	"name": String,
	"url": String
}
```

#### PATCH `{base-URL}/user/:username/video/:id` (tx)

Modify a video. A user can only modify their own videos via the current user. Any attempt to modify someone else’s videos will fail at the contract level.

The body for the request **must be structured** as above in the PATCH discussion section. The response will return a `tx` object for tracking.

Fields available to PATCH for the `user` resource:

* `flag` Boolean
* `blacklist` Boolean

#### DELETE `{base-URL}/user/:username/video/:id` (tx)

Remove a video. The owner name has to be tied to the users thelonious address. If you try to remove some other users videos it’ll just fail. Here in case we add admin rights to remove.

#### GET `{base-URL}/user/:username/videos/`

Gets all the users videos.

Reponse body:

```javascript
{
  "videos": [ String … ] // an array of video identifiers
}
```

#### GET `{base-URL}/user/:username/videos/:id`

Gets the video with the given id.

Response body:

```javascript
{
  "name": String,
  "hash": String,
  "upload_date": Number,
  "video_number": Number,
  "status": Number
}
```

### Resource: txs

Used to poll for txs.

#### GET `{base-URL}/txs/:thehash`

tx number is returned in the body of the response in plain text, ie: `3` is all that is returned.

Statuses are:

* `1` - Transaction is Pending
* `2` - Transaction Failed
* `3` - Transcation is Pending but network verified
* `4` - Transaction Succeeded

4 or 2 are those to look for. 1 and 3 means the transactions are in different stages of validation.

## A few miscellaneous notes

Hex strings are always prepended by 0x.
