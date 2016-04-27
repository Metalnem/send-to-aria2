# Send to aria2 [![Code Climate](https://codeclimate.com/github/Metalnem/send-to-aria2/badges/gpa.svg)](https://codeclimate.com/github/Metalnem/send-to-aria2) [![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://raw.githubusercontent.com/metalnem/send-to-aria2/master/LICENSE)

This Firefox extension captures download links and sends them to aria2 server. You can download it [here](https://addons.mozilla.org/en-US/firefox/addon/send-to-aria2/).

## Usage

Right click the link that you want to download, and select "Send to aria2" option. If the link requires basic HTTP authentication, and you have the username/password saved in your credentials cache, they will be sent automatically with the link, otherwise you will be presented with the popup where you can enter your credentials. Warning: because your HTTP credentials are sent in plaintext across the network, it is **strongly recommended** that you run your aria2 server with TLS enabled, or put it behind TLS termination proxy (like nginx or HAProxy).

## Client Configuration

For this extension to work, you have to specify at least JSON-RPC Path in the extensions preferences. If you are running your aria2 server on a domain [www.example.org](www.example.org) with default command line options, your JSON-RPC Path should look like this:

```
http://www.example.org:6800/jsonrpc
```

RPC Secret option is optional, but it's strongly recommended that you use it. To start the aria2 server that requires secret token for every job, pass it the --rpc-secret=some_secret_token command line option. Secret token is supported in versions 1.18.4 or newer.

## Server Configuration

To start aria2 server, run the following command:

```
aria2c --enable-rpc --rpc-listen-all=true --rpc-allow-origin-all --rpc-secret=some_secret_token
```
