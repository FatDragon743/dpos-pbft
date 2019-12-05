var assert = require('assert');
var net = require('net');
var protocol = require('./protocol');
/**
 * Peer类，以一个connect为单位，即net的封装
 * 成员变量：
 *    id          此次connect的一个代号
 *    localId     node节点ID
 *    socket      socket 走的port
 *    messageCb   发送到消息本体
 * 成员函数：
 *    外部函数：
 *    Peer        初始化函数，两种初始化方式：
 *                1.第一次建立connect，参数：
 *                        id      此次connect的一个代号，int，0-10
 *                        port    对应的connect 的socket 走的port ，默认为 10000+ID
 * ·                      localId node节点ID
 *                2.同一节点的同一view中的connect，重新利用之前建立的socket参数，参数：
 *                        id      假的，实际输入的是socket的结构体
 *                        port    假的，实际输入的是localId，即node节点ID
 *    send          发送消息，只是写入socket，没有实际发送
 *    getId         获取此次connect的一个代号
 *    setMessageCb  对于消息赋值
 *    close         关闭socket
 *    内部调用函数：
 *    onData_       组织结构体message，为stringbuffer，填充为connect的内容
 *    onConnected_  发送消息，真实实现
 *    onClose_      输出一句已经关闭的话？
 *                 
 * @param {*} id 
 * @param {*} port 
 * @param {*} localId 
 */
function Peer(id, port, localId) {
  this.buf = '';
  if (typeof id === 'number') {
    this.id = id;
    this.remotePort = port;
    this.localId = localId;
    this.socket = net.connect(port, this.onConnected_.bind(this));
  } else if (typeof id === 'object') {
    this.socket = id;
    this.localId = port;
    this.socket.setEncoding('utf8');
    this.socket.on('data', this.onData_.bind(this));
    this.socket.on('end', this.onClose_.bind(this));
  } else {
    assert(false);
  }
}
/**
 * 将msg写入socket，并没有发送它
 */
Peer.prototype.send = function (msg) {
  var data = JSON.stringify(msg);
  // console.log(this.localId + ' >> [' + this.id + ']', data);
  this.socket.write('' + data.length);
  this.socket.write('\n');
  this.socket.write(data);
}
/**
 * 返回 此次connect的一个代号
 */
Peer.prototype.getId = function () {
  return this.id;
}
/**
 * 设置消息内容，将结构体（function类型）写入 messageCb
 */
Peer.prototype.setMessageCb = function (cb) {
  assert(typeof cb === 'function');
  this.messageCb = cb;
}
/**
 * 关闭socket
 */
Peer.prototype.close = function () {
  this.socket.end();
}
/**
 * 真正发送出去
 */
Peer.prototype.onConnected_ = function () {
  console.log('peer ' + this.id + ' connected with ' + this.localId);
  this.socket.setEncoding('utf8');
  this.socket.on('data', this.onData_.bind(this));
  this.send(protocol.initMessage(this.localId));
}
/**
 * 处理data（string），序列化为结构体，并根据不同的msg的type，执行不同的操作
 * data例子
 * 
 * 5\n*****4\n****3\n***
 * 
 * 将data导入到data
 * start = 0
 * pos = 回车符号的位置
 * end = 0
 * 循环（buff中仍然存在回车）{
 *    len 长度都等于 start - pos（检验长度是否在正确范围内）
 *    body pos - end ，body的长度为len
 *    用结构体解析 body为msg本体
 *    msg.type == init ：
 *        peer.id = msg.id
 *    其他：
 *        插入到socket 的msg 部分中
 *    充值新的 start 和 pos 
 * }
 */
Peer.prototype.onData_ = function (data) {
  this.buf += data;
  var start = 0;
  var pos = this.buf.indexOf('\n', start);
  var end = 0;
  while (pos !== -1) {
    var len = parseInt(this.buf.substring(start, pos));
    if (this.buf.length - pos - 1 < len) {
      break;
    }
    var body = this.buf.substr(pos + 1, len);
    end = pos + 1 + len;

    var msg = JSON.parse(body);
    if (msg.type === protocol.MessageType.Init) {
      this.id = msg.id;
      console.log('peer ' + this.id + ' accpeted on ' + this.localId);
    }
    // console.log(this.localId + ' << ' + this.id, body);
    this.messageCb(this, msg);

    start = pos + 1 + len;
    pos = this.buf.indexOf('\n', start);
  }
  this.buf = this.buf.substring(end);
}
/**
 * 输出一句话，已经结束了
 */
Peer.prototype.onClose_ = function () {
  console.log('connection ' + this.id + ' -> ' + this.localId + ' closed');
}

module.exports = Peer;
