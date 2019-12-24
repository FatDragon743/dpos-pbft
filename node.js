var net = require('net');
var Peer = require('./peer');
var BlockChain = require('./blockchain');
var protocol = require('./protocol');
var Block = require('./block');
var Transaction = require('./transaction');

var PORT = 10000;
/**
 * 初始化节点，节点端口在 10000+i
 * @param {*} i 
 * @param {*} isBad 
 */
function Node(i, isBad) {
  this.id = i;
  this.isBad = isBad;
  this.peerIds = [];
  this.peers = {};

  this.server = net.createServer(this.onConnection_.bind(this));
  this.server.listen(PORT + i, function() {
    console.log('node ' + i + ' ready to accept');
  });

  this.blockchain = new BlockChain(this);
  this.blockchain.on('new-message', this.broadcast.bind(this));
}
/**
 * 初始化网络，选择5个随机数，发送消息，写入联系人列表
 */
Node.prototype.connect = function() {
  for (var i = 0; i < 5; ++i) {
    var rand = Math.floor(Math.random() * 10);
    if (rand !== this.id && !this.peers[rand]) {
      var peer = new Peer(rand, PORT + rand, this.id);
      peer.setMessageCb(this.processMessage_.bind(this));
      this.peerIds.push(rand);
      this.peers[rand] = peer;
    }
  }
}

Node.prototype.printBlockChain = function() {
  this.blockchain.printBlockChain();
}

Node.prototype.start = function() {
  this.blockchain.start();
}

Node.prototype.stop = function() {
}

Node.prototype.broadcast = function(msg) {
  for (var i in this.peers) {
    this.peers[i].send(msg);
  }
}

Node.prototype.onConnection_ = function(socket) {
  var peer = new Peer(socket, this.id);
  peer.setMessageCb(this.processMessage_.bind(this));
}

Node.prototype.processMessage_ = function(peer, msg) {
  var peerId = peer.getId();
  if (!this.peers[peerId]) {
    this.peers[peerId] = peer;
  }
  this.blockchain.processMessage(msg);
}

module.exports = Node;
