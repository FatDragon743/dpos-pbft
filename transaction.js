var crypto = require('crypto');
var ByteBuffer = require('bytebuffer');
var _ = require('lodash');
/**
 * Tx 类
 * 成员变量：
 *    amount    交易数量
 *    timestamp 时间戳
 *    recopient 接受者
 *    sender    发送者
 * 成员函数：
 *    calculateHash 计算hash
 *    getBytes      toString
 *    getXX         返回对应XX的成员变量的值
 * @param {*} data 
 */
function Transaction(data) {
  this.data = _.assign({
    amount: 0,
    timestamp: Math.floor(Date.now() / 1000),
    recipient: '',
    sender: ''
  }, data);
  if (!this.data.hash) {
    this.data.hash = this.calculateHash();
  }
}

Transaction.prototype.getData = function() {
  return this.data;
}

Transaction.prototype.getSize = function() {
  return this.size;
}

Transaction.prototype.getHash = function() {
  return this.data.hash;
}

Transaction.prototype.getAmount = function() {
  return this.data.amount;
}

Transaction.prototype.getTimestamp = function() {
  return this.data.timestamp;
}

Transaction.prototype.getRecipient = function() {
  return this.data.recipient;
}

Transaction.prototype.getSender = function() {
  return this.data.sender;
}

Transaction.prototype.getBytes = function() {
  var buf = new ByteBuffer();
  var d = this.data;
  buf.writeLong(d.amount);
  buf.writeInt(d.timestamp);
  buf.writeIString(d.recipient);
  buf.writeIString(d.sender);
  buf.flip();
  return buf.toBuffer();
}

Transaction.prototype.calculateHash = function() {
  var bytes = this.getBytes();
  this.size = bytes.length;
  return crypto.createHash('sha256').update(bytes).digest().toString('hex');
}

module.exports = Transaction;
