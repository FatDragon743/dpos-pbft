var assert = require('assert');
var protocol = require('./protocol');
var slots = require('./slots');
/**
 * 候选人数量，即总节点数量
 */
var PBFT_N = slots.delegates;
/**
 * 可以容忍的作恶节点数量
 */
var PBFT_F = Math.floor((PBFT_N - 1) / 3);
/**
 * 状态码表
 */
var State = {
  None: 0,
  Prepare: 1,
  Commit: 2,
};
/**
 * Pbft 结构体
 * 成员变量：
 *    blockchain        链
 *    node              节点
 *    pendingBlocks     缓存Block列表，待确认的区块
 *    prepareInfo       准备信息
 *    commitInfos       确认消息
 *    state             状态
 *    prepareHashCache  准备hash缓存
 *    commitHashCache   确认hash缓存
 *    currentSlot       当前Slot
 * 成员函数：
 *    hasBlock          此Block的hash是否已经在pendingBlocks中
 *    isBusy            state是否等于None
 *    addBlock          准备操作，根据block信息，写入缓存，并广播区块
 *    clearState        清空，设置state为None
 *    commit            确认区块，完成后clearState
 *    processMessage    处理接收到的Prepare，Commit消息
 *    
 *    
 * @param {*} blockchain 
 */
function Pbft(blockchain) {
  this.blockchain = blockchain;
  this.node = blockchain.node;
  this.pendingBlocks = {};
  this.prepareInfo = null;
  this.commitInfos = {};
  this.state = State.None;
  this.prepareHashCache = {};
  this.commitHashCache = {};
  this.currentSlot = 0;
}
/**
 * block的hash是否存在在pendingBlocks列表中
 */
Pbft.prototype.hasBlock = function(hash) {
  return !!this.pendingBlocks[hash];
}
/**
 * 当前节点的PBFT是否进入流程，进入为True
 */
Pbft.prototype.isBusy = function() {
  return this.state !== State.None;
}
/**
 * 添加block进入缓存列表，广播此区块
 * 当前节点作为主节点的时候调用
 * 输入：区块，当前轮次=（block的时间戳 - 系统启动时间）/时间间隔（10s）的向下取整
 * 流程：
 * 添加block进入pendingBlocks
 * 检查轮次（正常轮次<=当前轮次），区块是新的
 * 准备好 准备消息，自己投上一票
 * 广播 准备消息（出现）
 */
Pbft.prototype.addBlock = function(block, slot) {
  var hash = block.getHash();
  console.log('pbft addBlock', this.node.id, hash);
  this.pendingBlocks[hash] = block;
  if (slot > this.currentSlot) {
    this.clearState();
  }
  if (this.state === State.None) {
    this.currentSlot = slot;
    this.state = State.Prepare;
    this.prepareInfo = {
      height: block.getHeight(),
      hash: hash,
      votesNumber: 1,
      votes: {}
    };
    // TODO will need proof of node signature in formal implementation
    this.prepareInfo.votes[this.node.id] = true;
    var self = this;
    setTimeout(function() {
      self.node.broadcast(protocol.prepareMessage({
        height: block.getHeight(),
        hash: hash,
        signer: self.node.id
      }));
    }, 100);
  }
}

Pbft.prototype.clearState = function() {
  this.state = State.None;
  this.prepareInfo = null;
  this.commitInfos = {};
  this.pendingBlocks = {};
}

Pbft.prototype.commit = function(hash) {
  var block = this.pendingBlocks[hash];
  assert(!!block);
  this.blockchain.commitBlock(block);
  this.clearState();
}

Pbft.prototype.processMessage = function(msg) {
  switch (msg.type) {
    case protocol.MessageType.Prepare:
      var d = msg.body;
      var key = d.hash + ':' + d.height + ':' + d.signer;
      if (!this.prepareHashCache[key]) {
        this.prepareHashCache[key] = true;
        this.node.broadcast(msg);
      } else {
        return;
      }
      if (this.state === State.Prepare &&
          d.height === this.prepareInfo.height &&
          d.hash === this.prepareInfo.hash &&
          !this.prepareInfo.votes[d.signer]) {
        this.prepareInfo.votes[d.signer] = true;
        this.prepareInfo.votesNumber++;
        console.log('pbft %d prepare votes: %d', this.node.id, this.prepareInfo.votesNumber);
        if (this.prepareInfo.votesNumber > PBFT_F) {
          console.log('node %d change state to commit', this.node.id);
          this.state = State.Commit;
          var commitInfo = {
            height: this.prepareInfo.height,
            hash: this.prepareInfo.hash,
            votesNumber: 1,
            votes: {}
          };
          commitInfo.votes[this.node.id] = true;
          this.commitInfos[commitInfo.hash] = commitInfo;
          this.node.broadcast(protocol.commitMessage({
            height: this.prepareInfo.height,
            hash: this.prepareInfo.hash,
            signer: this.node.id
          }));
        }
      }
      break;
    case protocol.MessageType.Commit:
      var d = msg.body;
      var key = d.hash + ':' + d.height + ':' + d.signer;
      if (!this.commitHashCache[key]) {
        this.commitHashCache[key] = true;
        this.node.broadcast(msg);
      } else {
        return;
      }
      var commit = this.commitInfos[d.hash];
      if (commit) {
        if (!commit.votes[d.signer]) {
          commit.votes[d.signer] = true;
          commit.votesNumber++;
          console.log('pbft %d commit votes: %d', this.node.id, commit.votesNumber);
          if (commit.votesNumber > 2 * PBFT_F) {
            this.commit(d.hash);
          }
        }
      } else {
        this.commitInfos[d.hash] = {
          hash: d.hash,
          height: d.height,
          votesNumber: 1,
          votes: {}
        }
        this.commitInfos[d.hash].votes[d.signer] = true;
      }
      break;
    default:
      break;
  }
}

module.exports = Pbft;
