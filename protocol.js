/**
 * 消息类型 对于不同的消息类型给与一个整型的代码对应
 */
var MessageType = {
  Init: 1,
  Block: 2,
  Prepare: 3,
  Commit: 4
};

module.exports = {
  MessageType: MessageType,
  /**
   * 初始化类型消息
   * node节点ID
   */
  initMessage: function (id) {
    return { type: MessageType.Init, id: id };
  },
  /**
   * 区块信息消息，记账节点向全网广播确认好的区块
   * 主节点向从节点分发可能的候选区块
   * @param {*} body 
   */
  blockMessage: function (body) {
    return { type: MessageType.Block, body: body };
  },
  /**
   * pbft 消息中的准备消息
   * @param {*} body 
   */
  prepareMessage: function (body) {
    return { type: MessageType.Prepare, body: body };
  },
  /**
   * pbft 消息中的确认消息
   * @param {*} body 
   */
  commitMessage: function (body) {
    return { type: MessageType.Commit, body: body };
  },
};
