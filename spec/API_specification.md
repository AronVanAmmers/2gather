**2gather - specification**

**UI**

**NOTE: Mine has been added. endpoint is BASE_URL/mining  Just POST with ‘on’ or ‘off’ in the body, plain text for now.**

This is what the UI does for now:

* When it loads it checks the user account on the blockchain. If the user has no account it should ask if he wants to make one. (this happens by sending an ‘Init’ request from the UI when the page is loaded)

* When the user is found, it should display some basic info about him, such as the user name, the list of his posted videos, and a list of the active subscriptions.

* When the user clicks on one of his subscriptions, it should switch to that users page instead of his own, where it shows that users videos and subs, etc.

* There should also be a video player somewhere, that shows the video, the name of the video, the name of the user that posted the video (this should be a link to their site), and a link that allows the viewer to tip the video poster in bitcoin.

Notable differences from youtube:

* There is no starting page with popular videos or something like that. It’s just the user account and his own videos/subs. 

* There is no way to search for videos.

The real purpose of this dapp, or at least the initial release, is to test decerver module inter-op, and to show the potential of the platform.

**Layout**

Channel page

* Public side: List of videos you have posted

* Private: Channel administrative stuff (set BTC etc)

Search for username

Subscriptions page:

* Displays recent vids from your subs

Lots of flexibilty here regarding precise design.

**Request format:** RESTful service (GET and Delete only url and query params; POST and PUT json body)

**Response format:** JSON in body.

**API calls**

**Resources**

<table>
  <tr>
    <td>resource type</td>
    <td>description</td>
  </tr>
  <tr>
    <td>user</td>
    <td>A user has a channel, a user name, a bitcoin address (optional), videos, subscribers, and some other things.</td>
  </tr>
  <tr>
    <td>user.subscriber</td>
    <td>A subscriber is the name of another user to whom the user subscribes.</td>
  </tr>
  <tr>
    <td>user.videos</td>
    <td>Videos associated with a file/stream, a channel, and some other things.</td>
  </tr>
  <tr>
    <td>txs</td>
    <td>Used for checking on txs.</td>
  </tr>
  <tr>
    <td>mining</td>
    <td>Used to turn mining on and off.</td>
  </tr>
  <tr>
    <td>session</td>
    <td>The current active session.</td>
  </tr>
</table>


This is a list of useful API calls. {base-URL} is **[http://localhost:3000/apis/2gathe**r](http://localhost:3000/http/2gather/user/create?name=the_users_name)

Note that all api calls with the flag (**tx**) include transactions to the blockchain, which means all you get back from the call is a transaction hash. To check whether or not this transaction succeeds, it needs to be tracked. The way I do it with websockets is normally by storing the hash and subscribing to transaction events from the thelonious (monk) module. the tx will trigger either a tx or a tx:failed event, and when that happens it’s sent back over the socket.

With http you get the tx hash when making a request that ends in a transaction. This hash can be used when polling to see if the tx has been processed.

**PATCH**

Patches should have this format:

Patch:

{ 

"op":     String

"field":    String

"value":  depends on the field

}

ops are: "replace" and “remove”

**Users and videos**

These are the standard objects for users and videos:

**User**

{

"user_name" :   String

"channel_id" :    String

"created" :     String

"btc_address" :   String

"doug_perm" :   Bool

"blacklist_perm" :  Bool

"videos" :    [ Video … ] (an array of video identifiers)

"subscribers" :   [ String … ]    (an array of user names)

}

**Video**

{

"name" : String

"date" : String

"vidnum" : String (Hex, 0x01, 0x02 etc.)

"status" : String (Hex, like vidnum)

"url" : String (Url to endpoint where the actual video data can be found.)

}

**Blockchain transactions**

When it comes to actions that requires a blockchain transaction (everything but GET operations), it will return a transaction hash which can be used for polling.

If the action requires a tx, the request will have a **(tx)** in front of it, like in **(POST)** **user**. If nothing else is specified, the body of the response will contain only the hash as a hexstring (prepended by 0x).

**Resource: user**

**(tx) (POST) ****{base-URL}/user**

Create a new user account. This will create an account and let them post/remove videos, and add/remove subscriptions.Z

Request Body:

{

  "user_name" : String

}

**(tx) (DELETE) ****{base-URL}/user/:username**

Delete a user account. This account has to be tied to the users thelonious address. If you try to remove some other users account it’ll just fail. This will require a username in case we add the possibility for admins to remove other users later.

**(GET) {base-URL}/user/:username**

Get user data.

User

**(tx) (PATCH)**** {base-URL}/user/:username**

Modify a user. A user can only modify the account tied to their thelonious address. Any attempt to modify someone else’s address will fail.

Request Body:

[ Patch ... ]

Response body:

[ Tx ...]

Fields:

"btc_addr"    String (bitcoin address)

"doug_perm"     Boolean

"blacklist_perm"  Boolean

To set doug or blacklist permissions for a user, just send a ‘replace’. It will only set it to true. To remove it send a ‘remove’.

**Resource: user.subscriber**

**(tx) (POST) {base-URL}/user/username/subs/**

Subscribe to the target user.

Request Body:

{

  "user_name" : String

}

**(tx) (DELETE) {base-URL}/user/username/subs/:subname**

This causes the active user to unsubscribe to the target user. The target must be subscribed to by the active user or it will fail.

**Resource: user.videos**

**(tx) (POST) ****{base-URL}user/:username/videos**

Uploads a video.

Request Body:

{

  "name" :  String

  "url" :     String

}

**(PATCH) {base-URL}/user/:username/videos/:vidnum**

Request Body:

[ Patch ... ]

Response body:

[ Tx ...]

Fields:

"flag"      Boolean

"blacklist"     Boolean

To set doug or blacklist permissions for a user, just send a ‘replace’. It will only set it to true. To remove it send a ‘remove’.

**(tx) (DELETE) ****{base-URL}/user/:username/video/:vidnum**

Remove a video. The owner name has to be tied to the users thelonious address. If you try to remove some other users videos it’ll just fail. Here in case we add admin rights to remove.

**(GET) {base-URL}/user/:username/videos/:vidnum**

Gets the video with the given id.

Response body:

Video

**Resource: txs**

Used to poll for txs.

**(GET) {base-URL}/txs/:hash**

tx number in plain text, ie: 3

Statuses are:

1 - Pending

2 - Failed

3 - Pending but verified

4 - Succeeded

4 or 2 are those to look for. 1 and 3 means theyre in different stages of validation.

**Resource: mining**

Used to set mining on or off

**(POST) {base-URL}/mining**

tx number in plain text, ie: 3

Statuses are:

Request Body:

"on" or “off”.

Response body:

Nothing useful.

**Resource: session**

Used to get the user data of the current user. 404s if no active session.

**(GET) {base-URL}/session**

Response body:

User

**Additional information**

Issues that are still to be resolved.

**Loading videos**

When it comes to how the videos are actually served we have to discuss that. There are some limitations.

**Bitcoin**

You can not yet do a btc transaction

**Other info**

Hex strings are always prepended by 0x.

