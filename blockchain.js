//  assert(!!lastBlock); 内部函数 若值为空 报错跳出
var assert = require('assert');
// util负责继承，eventemitter 负责在函数初始化失败时，跳出，详细 文档：util 和 event.md
// 链接：http://note.youdao.com/noteshare?id=a56510abda88cd5f88ee7ee5da218e29&sub=C7C6CBC443154E5C89B603EA2855575A
var EventEmitter = require('events');
var util = require('util');
// 本地模块 提供slotnumber，即下一个候选节点ID
var slots = require('./slots');
// 本地模块 提供协议
var protocol = require('./protocol');
// 本地模块 提供Block类
var Block = require('./block');
// 本地模块 提供Tx类
var Transaction = require('./transaction');
// 本地模块 提供HashKist 类,本质是 BlockChain 内部Chain部分的数据结构 hash链表
var HashList = require('./hashlist');
// 本地模块 提供PBFT协议
var Pbft = require('./pbft');

var COIN = 100000000;
/**
 * BlockChain 类
 * 内部成员：
 *  node 当前节点
 *  genesis 创世区块
 *  pendingTransactions 缓存队列
 *  transactionIndex 交易检索结构体
 *  chain hash队列
 *  pbft 协议
 *  lastSlot 上一个候选节点
 * @param {*} node 
 */
function BlockChain(node) {
  EventEmitter.call(this);
  this.node = node;
  this.genesis = new Block({
    height: 0,
    timestamp: 1462953000,
    previousHash: '',
    generatorId: 0,
    transactions: [
      {
        amount: 100000000 * COIN,
        timestamp: 1462953000,
        recipient: 'neo',
        sender: '',
      }
    ]
  });
  this.pendingTransactions = {};

  //txIndex[txHash] = txContent
  this.transactionIndex = {};

  this.chain = new HashList();
  this.chain.add(this.genesis.getHash(), this.genesis);
  this.pbft = new Pbft(this);
  this.lastSlot = 0;
}

util.inherits(BlockChain, EventEmitter);
/**
 * 开始 1s 1个loop
 */
BlockChain.prototype.start = function () {
  var self = this;
  setImmediate(function nextLoop() {
    self.loop_(function () {
      setTimeout(nextLoop, 1000);
    });
  });
}

// 获取 tx 的 hash，通过hash 检索，pending 和 commited 的 tx 列表，返回tx是否从来没有出现过
BlockChain.prototype.hasTransaction = function (trs) {
  var id = trs.getHash();
  return !!this.pendingTransactions[id] || !!this.transactionIndex[id];
}

// 交易是否为空
BlockChain.prototype.validateTransaction = function (trs) {
  return !!trs;
}

// 新出现的tx 先加入 pending 队列。 
BlockChain.prototype.addTransaction = function (trs) {
  this.pendingTransactions[trs.getHash()] = trs;
}

// 该 block 的 hash 是否已经出现在chain上了，或者已经在 pbft 程序中
BlockChain.prototype.hasBlock = function (hash) {
  return !!this.chain.get(hash) || this.pbft.hasBlock(hash);
}

// 该block是否为空，且是否合法（为最后一个区块之后的顺序区块，height和hash是否延续）
BlockChain.prototype.validateBlock = function (block) {
  if (!block) {
    return false;
  }
  var lastBlock = this.chain.last();
  return block.getHeight() === lastBlock.getHeight() + 1 &&
    block.getPreviousHash() === lastBlock.getHash();
}

// 添加 block 
// 不通过 pbft 且 不是坏节点 -> 加入pbft 程序
// 通过 pbft 或者 坏节点 -> 直接将其添加到chain上，且不忙碌
BlockChain.prototype.addBlock = function (block) {
  if (Flags.pbft && !this.node.isBad) {
    var slotNumber = slots.getSlotNumber(slots.getTime(block.getTimestamp() * 1000));   
    this.pbft.addBlock(block, slotNumber);
  } else {
    this.commitBlock(block);
    this.isBusy = false;
  }
}


// 正式承认区块合法性，将区块加入chain，将该区块中的所有tx加入 txIndex[txHash] = txContent
BlockChain.prototype.commitBlock = function (block) {
  this.chain.add(block.getHash(), block);
  var transactions = block.getTransactions();
  for (var i in transactions) {
    this.transactionIndex[transactions[i].getHash()] = transactions[i];
  }
}
// chain 处理消息
// 开始处理：接受到一个 tx，开始整个 共识过程
//    tx -> new tx 如果没有 出现过 且 不为空 则 广播 tx 且 加入 pending 队列
// 结束处理：接受到一个 block，结束共识过程，添加进入chain末尾，并广播区块（已经完成共识，所有节点完成的动作，就是接受节点并且转发）
//    block -> new block 如果没有出现过且不为空 则广播 block 且 加入 chain
// 其他 -> （好节点）进入pbft流程
BlockChain.prototype.processMessage = function (msg) {
  switch (msg.type) {
    case protocol.MessageType.Transaction:
      var trs = new Transaction(msg.body);
      if (!this.hasTransaction(trs)) {
        if (this.validateTransaction(trs)) {
          this.node.broadcast(msg);
          this.addTransaction(trs);
        }
      }
      break;
    case protocol.MessageType.Block:
      var block = new Block(msg.body);
      if (!this.hasBlock(block.getHash())) {
        if (this.validateBlock(block)) {
          this.node.broadcast(msg);
          this.addBlock(block);
        }
      }
      break;
    default:
      if (Flags.pbft && !this.node.isBad) {
        this.pbft.processMessage(msg);
      }
      break;
  }
}

/**
* 创建 block
* 获得最后一个block
* 计算新区块的height，timestamp，上一个blockhash，block创建者node的ID
* 加入所有pending 队列中的tx，清空pending
* 返回 newblock
*/
BlockChain.prototype.createBlock = function (cb) {
  var lastBlock = this.chain.last();
  assert(!!lastBlock);
  var newBlock = new Block({
    height: lastBlock.getHeight() + 1,
    timestamp: Math.floor(Date.now() / 1000),
    previousHash: lastBlock.getHash(),
    generatorId: this.node.id,
  });
  for (var k in this.pendingTransactions) {
    newBlock.addTransaction(this.pendingTransactions[k]);
  }
  this.pendingTransactions = {};
  return newBlock;
}
/**
 * 打印blockchain 
 * （第i个block:hash前6位:产生该区块的node ID）->（第i+1个block:hash前6位:产生该区块的node ID）->
 */
BlockChain.prototype.printBlockChain = function () {
  var output = '';
  this.chain.each(function (block, i) {
    output += util.format('(%d:%s:%d) -> ', i, block.getHash().substr(0, 6), block.getGeneratorId());
  });
  console.log('node ' + this.node.id, output);
}

/**
 *  制造分叉
 * 模拟整个流程 创建block1 -> 伪造 tx1 队列[就一个tx1(cracher->alice:1000)] -> 创建block2 -> 伪造 tx2 队列[就一个tx2(cracher->bob:1000)]
 * -> 打印 （攻击节点 ID，攻击区块高度，分叉1：block1的hash，分叉2：block2的hash）
 * -> 将 此node存储的 通讯录中的 一般的节点发送 block1，另外一半的节点发送 block2，并打印该行为
 * -> 此节点 采纳 block1
 */
BlockChain.prototype.makeFork_ = function () {
  var lastBlock = this.chain.last();
  assert(!!lastBlock);
  var height = lastBlock.getHeight() + 1;
  var timestamp = Math.floor(Date.now() / 1000);
  var block1 = new Block({
    height: height,
    timestamp: timestamp,
    previousHash: lastBlock.getHash(),
    generatorId: this.node.id
  });
  block1.addTransaction(new Transaction({
    amount: 1000,
    recipient: 'alice',
    sender: 'cracker'
  }));
  var block2 = new Block({
    height: height,
    timestamp: timestamp,
    previousHash: lastBlock.getHash(),
    generatorId: this.node.id
  });
  block2.addTransaction(new Transaction({
    amount: 1000,
    recipient: 'bob',
    sender: 'cracker'
  }));
  console.log('fork on node: %d, height: %d, fork1: %s, fork2: %s', this.node.id, lastBlock.getHeight() + 1, block1.getHash(), block2.getHash());
  var i = 0;
  for (var id in this.node.peers) {
    if (i++ % 2 === 0) {
      console.log('send fork1 to', id);
      this.node.peers[id].send(protocol.blockMessage(block1.getData()));
    } else {
      console.log('send fork2 to', id);
      this.node.peers[id].send(protocol.blockMessage(block2.getData()));
    }
  }
  this.addBlock(block1);
}


/**
 * 获得当前候选节点ID 和 最近一个区块 和 上一个候选节点ID
 * 如果 两次节点相同 或者 要求出块时间大于5S 跳出
 * 如果 PBFT flag 且 两次候选一致 跳出
 * 候选 % 节点数量 = 授权节点ID
 * 如果本节点为 授权节点（被选中的孩子）
 *    如果 好节点
 *        开始主持事务，添加Block，发送 new-message，记录自己是
 *    不是 好节点
 *        制造分叉
 */
BlockChain.prototype.loop_ = function (cb) {
  var currentSlot = slots.getSlotNumber();
  var lastBlock = this.chain.last();
  assert(!!lastBlock);
  // this.printBlockChain();
  var lastSlot = slots.getSlotNumber(slots.getTime(lastBlock.getTimestamp() * 1000));
  if (currentSlot === lastSlot || Date.now() % 10000 > 5000) {
    return cb();
  }
  if (Flags.pbft && this.lastSlot === currentSlot) {
    return cb();
  }
  var delegateId = currentSlot % slots.delegates;
  if (this.node.id === delegateId) {
    if (!this.node.isBad) {
      var block = this.createBlock();
      console.log('slot: %d, height: %d, nodeId: %d', currentSlot, block.getHeight(), this.node.id);
      this.addBlock(block);
      this.emit('new-message', protocol.blockMessage(block.getData()));
      this.lastSlot = currentSlot;
      // to do
    } else {
      this.makeFork_();
    }
  }
  cb();
}

module.exports = BlockChain;
