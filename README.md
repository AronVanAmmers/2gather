[![Circle CI](https://circleci.com/gh/eris-ltd/2gather.svg?style=svg)](https://circleci.com/gh/eris-ltd/2gather)

## 2gather -- A Distributed Video Sharing Application

A video sharing DApp (distributed application) which uses smart contracts to structure the application's logic, a distributed file store system to share the content between application users, and BTC to incentivize content creation.

## Introduction

Briefly, (because this is a Readme) there are three major pieces to this application. For a more detailed description of the DApp logic please [see Andreas' blog post on the topic](https://eng.erisindustries.com/tutorials/2015/04/07/2gather/). For a more detailed description of how we operate the blockchain network please [see Casey's blog post on the topic](https://eng.erisindustries.com/blockchains/2015/04/01/peer-server-networks-current-paradigm/).

### Video Files

This DApp makes use of [IPFS](http://ipfs.io) to store, share, and distribute video files. IPFS works on the concept of immutable hashes. These are unstructured data in the form of video files.

### Application Logic

The logic for the application, which remembers and utilizes immutable hashes stored, shared, and distributed by the IPFS protocol, resides in Eris Industries' `erisdb` system, a smart contract enabled, smart contract [controlled blockchain](https://thelonious.io).

### View Layer

The view layer for 2gather is an Angular application which is ran in any compatible web browser. The user interface (aka, view layer) makes JS calls back to the Decerver hosted middlewear layer which provides a routing framework, method framework, and connection to both the `erisdb` and `ipfs` systems.

## State of Development

This DApp is in active development. Here is what we have done and not done.

* ~~contracts suite~~
* ~~deployment controller (.pdx)~~
* ~~api specification~~
* ~~api routing framework~~
* ~~api methods framework~~
* ~~api connections framework~~
* ~~test suite blockchain~~
* ~~continuous integration system~~
* ~~fig files for production~~
* ~~fig files for testing~~
* ~~build prototype view layer~~
* ~~connect prototype view to API endpoints~~
* ~~display BTC addresses for [ProTipHQ](https://www.indiegogo.com/projects/protip-peer-to-peer-tipping-for-the-web) integration~~
* production blockchain
* add a ChangeTip functionality ...?

### Warning

This distributed application (DApp) is ready for wider beta testing.

Please note, however, that the blockchain it uses may have to be reset from time to time. We do not currently have a backup/export/import functionality for smart contract housed information (yet), so at this time when the blockchain resets all videos are lost and will have to be readded.

## Installation

In general there are three ways in which to install the 2gather distributed application, an easy way (which we recommend), a medium way, and a hard way.

### Low Difficulty Installation

**Dependencies**: for the easy installation there are 2 required dependencies: [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/).

Docker is a run anywhere container solution which we feel makes development, deployment, testing, and running of distributed applications a breeze. We are moving most of our development, testing, and usage efforts for Eris Industries to use a container-based paradigm. Given the complexity of getting p2p software running, Docker containers provide an excellent mechanism for handling the building and running of distributed applications.

Docker Compose (recently renamed from the `fig` tool which was purchased by Docker last year) is a way to compose groups of containers and makes running those containers ultra simple. The first time you `docker-compose up` it will take a while to download and configure the base images. After that it will be ultra fast due to Docker's intelligent caching features.

[Install Docker](http://docs.docker.com/installation/). Install instructions will vary by platform. **NOTE** Eris Industries requires a docker version >= 1.4 to work properly. We highly recommend that you install docker version 1.5.

Ubuntu:

```bash
$ curl -sSL https://get.docker.com/ubuntu/ | sudo sh
```

[Install Docker Compose](https://docs.docker.com/compose/#installation-and-set-up):

64 bit Linux && OSX:

```bash
$ curl -L https://github.com/docker/compose/releases/download/1.1.0/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose
$ chmod +x /usr/local/bin/docker-compose
```

If you run into problems on linux, execute the `curl` command from a sudo shell.

Make sure Docker is installed properly:

```bash
$ (sudo) docker version
```

Alternatively:

```bash
$ (sudo) pip install -U docker-compose
```

**Go Vroom**: Once you have Docker and Docker-Compose installed the rest is ultra simple.

First clone this repository:

```bash
$ git clone https://github.com/eris-ltd/2gather
$ cd 2gather
```

```bash
$ (sudo) docker-compose -f docker-compose-get.yml up
```

N.B. If you do not have `git` installed and do not want to install it, then you can simply copy and paste the contents of [this file](https://github.com/eris-ltd/2gather/blob/master/docker-compose-get.yml) into a `docker-compose.yml` file in any directory and then start the DApp with:

```bash
$ (sudo) docker-compose up
```

Whichever command sequence you use, you should now have the DApp running in your terminal window. After that simply go to any web browser to [play with 2gather](http://localhost:3000/2gather).

### Medium Difficulty Installation

**Dependencies**: this method requires Docker and Docker-Compose to be installed (please see above for installation instructions). Once those are installed then clone this repository:

```bash
git clone git@github.com:eris-ltd/2gather.git
cd 2gather
```

Next, you'll need to install the front end dependencies. We use the [Bower](http://bower.io/) package manager to manage our front end dependencies. Note that Bower is a [Node.js](https://nodejs.org/) program and Bower depends on Node.

```bash
bower install
```

**Go Vroom**: At this point there are two possible compositions of the containers which you can use. The composition we suggest starting with is the testing containers which will deploy your own chain locally along with all of the contracts required for the DApp and allow you to begin operating the DApp on a local chain.

```bash
(sudo) docker-compose -f spec/docker-compose.yml up
```

The second way you could work is to link into the public testing chain which we use. Note, the production blockchain will be released when we have finalized the testing cycle. See the `Status` section above. To work with the public test chain

```bash
(sudo) docker-compose up
```

Note that depending on your system setup `sudo` command may or may not be necessary.

Note that when using the testing composition with the `-f spec/docker-compose.yml` flag, you will want to wait about 60 seconds after the containers boot before working with the API. This is to allow the chain to be established and the contracts to be deployed.

#### Warning When Using Containers

**NOTE**: When using containers, the keys do not persist. In addition, the usernames are tied to a public key address. So if you use a container and then restart the container you will get a new key so you will have to reregister with a *new* username unless you deleted your old username before exiting the containers before -- as only one username is allowed per chain and each username is tied to a public key address.

The containers are for rapid prototyping and testing and so we do not see this as a problem as it is using containers how they should be used. We are working toward moving keys as close as possible to the user (ideally, in the browser), but that work will be ongoing for quite some time.

If you wish to persist your username then you will have to use the High Difficulty Installation below or export a volume which contains the keys (the latter of which we'd love any bug reports on).

### High Difficulty Installation

While we **highly** encourage folks to begin using a container based system for working with distributed applications, we understand that not everyone will want to do that.

2gather works just as well outside of containers.

#### Step 1: Get the tools

Follow our [Go VROOM Guide Here](https://decerver.io/tutorials/).

Follow IPFS's [Guide Here](https://github.com/ipfs/go-ipfs).

You'll need to install the front end dependencies as well. We use the [Bower](http://bower.io/) package manager to manage our front end dependencies. Note that Bower is a [Node.js](https://nodejs.org/) program and Bower depends on Node.

You will also need the `jq` program installed.

On Ubuntu:

```bash
sudo apt-get install jq
```

On OSX:

```bash
brew install jq
```

For other systems see the [JQ download page](http://stedolan.github.io/jq/download/).

#### Step 2: Install the DApp

Clone this repository into your `~/.decerver/dapps` folder:

```bash
git clone git@github.com:eris-ltd/2gather.git ~/.decerver/dapps/2gather
cd ~/.decerver/dapps/2gather
```

Install the front end dependencies:

```bash
bower install
```

#### Step 3: Start IPFS

Make sure that an IPFS gateway is running and is write accessible on port 8080.

```bash
ipfs daemon -writable
```

Note that IPFS daemon command will block in a terminal, so you will need to run it in a separate terminal window.

#### Step 4a: Roll your own Chain (Optional)

If you would like a chain for testing, then execute the `spec/teststart.sh` file. That will establish a new chain with proper configuration for local testing.

#### Step 4b: Connect to the Public Test Chain (Optional)

If you would like to connect to the public test chain then execute the `./start.sh` file.

### Running the app

When the DApp is running, open [http://localhost:3000/2gather/](http://localhost:3000/2gather/) in a browser.

## License

GPL. See LICENSE.txt file.

## Contributions

We are happy to accept contributions to this template distributed applications with the proviso that any and all contributions will be licensed GPL by Eris Industries.

Even better than contributions to this template, please press the big FORK button at the top and make the DApp your own. Do cool shit with it.

Run it on your own chain. Connect with your own community. And **most importantly** HAVE FUN!

Enjoy DApp-ing! :)
