//加密算法库
var crypto = require('crypto');
// 字符串buffer
var ByteBuffer = require('bytebuffer');
// 工具库  Array Math Number Seq String
var _ = require('lodash');
// 自己写的库 Tx
var Transaction = require('./transaction');

/**
 * Block 类
 * 内部成员：
 *  data:{}
 *    version: 0,版本号
 *    height: 0,区块高度
 *    size: 0,大小
 *    timestamp: 0,时间戳
 *    generatorId: 0,生成节点ID
 *    previousHash: '',前一个区块头部Hash
 *    merkleHash: '',本区块所有交易默克尔树Hash
 *    transactions: []，区块交易列表,成员为字符串
 * transactions：[],区块交易列表，成员为tx类
 * 内部函数：
 *  addTransaction
 *  getData
 *  getVersion
 *  getHeight
 *  getSize
 *  getTimestamp
 *  getGeneratorId
 *  getPreviousHash
 *  getHash
 *  getMerkleHash
 *  getTransactions
 *  calculateMerkleHash
 *  calculateHash
 * @param {*} data 结构体，初始化区块
 */
function Block(data) {
  /**
   * 初始化Block
   * 导入data 初始化成员变量
   * 检查所有交易 统计size（每个交易size相加）将data中的交易（字符串形式）转化为结构体，由./transaction提供技术支持
   *  如果data中的tx[]为空，则此区块为coinbase区块，将coinbase交易加入tx队列
   * 重新置换一遍
   * 填充block的size，merkleHash，hash
   */ 
  this.data = _.assign({
    version: 0,
    height: 0,
    size: 0,
    timestamp: 0,
    generatorId: 0,
    previousHash: '',
    merkleHash: '',
    transactions: []
  }, data);

  this.transactions = [];
  var size = 0;
  for (var i in this.data.transactions) {
    var t = new Transaction(this.data.transactions[i]);
    size += t.getSize();
    this.transactions.push(t);
  }
  if (this.transactions.length === 0) {
    var coinbaseTrs = new Transaction({
      amount: 5,
      recipient: 'somebody',
      sender: 'nobody'
    });
    size += coinbaseTrs.getSize();
    this.transactions.push(coinbaseTrs);
  }
  for (var i in this.transactions) {
    this.data.transactions.push(this.transactions[i].getData());
  }
  if (!this.data.size) {
    this.data.size = size;
  }
  if (!this.data.merkleHash) {
    this.data.merkleHash = this.calculateMerkleHash();
  }
  if (!this.data.hash) {
    this.data.hash = this.calculateHash();
  }
}
/**
 * 加入一个tx结构体，重新计算 size merkleHash hash
 */
Block.prototype.addTransaction = function (trs) {
  this.transactions.push(trs);
  this.size += trs.getSize();
  this.data.transactions.push(trs.getData());
  this.data.merkleHash = this.calculateMerkleHash();
  this.data.hash = this.calculateHash();
}
/**
 * getXX
 * 获取XX元素的值
 */
Block.prototype.getData = function () {
  return this.data;
}

Block.prototype.getVersion = function () {
  return this.data.version;
}

Block.prototype.getHeight = function () {
  return this.data.height;
}

Block.prototype.getSize = function () {
  return this.data.size;
}

Block.prototype.getTimestamp = function () {
  return this.data.timestamp;
}

Block.prototype.getGeneratorId = function () {
  return this.data.generatorId;
}

Block.prototype.getPreviousHash = function () {
  return this.data.previousHash;
}

Block.prototype.getHash = function () {
  return this.data.hash;
}

Block.prototype.getMerkleHash = function () {
  return this.data.merkleHash;
}

Block.prototype.getTransactions = function () {
  return this.transactions;
}
/**
 * 计算 tx的merkleHash
 * 用hashs[]存储,初始 hash[i] = i.gethash()
 * 更新hash[i] = hash(hash(2*i)+hash(2*i+1))
 * 结束条件 长度为奇数 即 1 -> 结束，hash[0]即为树根；其他奇数，push一个最后一个hash，使其成为偶数
 */
Block.prototype.calculateMerkleHash = function () {
  var hashes = [];
  this.transactions.forEach(function (t) {
    hashes.push(t.getHash());
  });
  while (hashes.length > 1) {
    var tmp = [];
    for (var i = 0; i < hashes.length / 2; ++i) {
      var md = crypto.createHash('sha256');
      md.update(hashes[i * 2]);
      md.update(hashes[i * 2 + 1]);
      tmp.push(md.digest().toString('hex'));
    }
    if (hashes.length % 2 === 1) {
      tmp.push(hashes[hashes.length - 1]);
    }
    hashes = tmp;
  }
  return hashes[0];
}
/**
 * 计算区块头部Hash
 * new 一个Buff 写入data的数据，除了tx队列
 */

Block.prototype.calculateHash = function () {
  var buf = new ByteBuffer();
  var d = this.data;
  buf.writeInt(d.version);
  buf.writeInt(d.height);
  buf.writeInt(d.size);
  buf.writeInt(d.timestamp);
  buf.writeInt(d.generatorId);
  buf.writeIString(d.previousHash);
  buf.writeIString(d.merkleHash);
  buf.flip();
  var bytes = buf.toBuffer();
  return crypto.createHash('sha256').update(bytes).digest().toString('hex');
}

module.exports = Block;