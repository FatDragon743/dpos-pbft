/**
 * 2016-05-11 15:50:00
 * magic time 
 * 系统启动时间
 */
function beginEpochTime() {
  var d = new Date(1462953000000);

  return d;
}

/**
 * 当前时间-magic time
 * 和系统启动时间差
 * @param {*} time 
 */
function getEpochTime(time) {
  if (time === undefined) {
    time = (new Date()).getTime();
  }
  var d = beginEpochTime();
  var t = d.getTime();
  return Math.floor((time - t) / 1000);
}

module.exports = {
  /***
   * 时间间隔 单位为s 每10进行一次
   */
  interval: 10,
  /**
   * 一个20个候选人
   */
  delegates: 20,
  /***
   * 获得时间差
   */
  getTime: function (time) {
    return getEpochTime(time);
  },
  /**
   * 根据时间差 返回 真实时间
   * 基准时间+时间差 返回当前时间？
   * 返回的当前时间 除去了毫秒的值，给一个小于此值的最小整数
   * @param {*} epochTime 
   */
  getRealTime: function (epochTime) {
    if (epochTime === undefined) {
      epochTime = this.getTime()
    }
    var d = beginEpochTime();
    var t = Math.floor(d.getTime() / 1000) * 1000;
    return t + epochTime * 1000;
  },
  /**
   * 用于计算时间戳偏移量，每经过10s（interval），其结果加1，对其结果取20的余数就可以获得出票节点编号。
   * 时间差（一代的时间） / 间隔
   * @param {*} epochTime 
   */
  getSlotNumber: function (epochTime) {
    if (epochTime === undefined) {
      epochTime = this.getTime()
    }
    return Math.floor(epochTime / this.interval);
  },

  /**
   * 根据时间戳偏移量 反向计算时间差
   * @param {*} slot 
   */
  getSlotTime: function (slot) {
    return slot * this.interval;
  },
  /**
   * 获得下一个时间戳偏移量
   */
  getNextSlot: function () {
    var slot = this.getSlotNumber();

    return slot + 1;
  },
  /***
   * 获得上一个时间错偏移量
   */
  getLastSlot: function (nextSlot) {
    return nextSlot + this.delegates;
  },
/**
 * 获得时间的 1462953000000 末三位为000的值
 * @param {*} date 
 */
  roundTime: function (date) {
    Math.floor(date.getTime() / 1000) * 1000
  }
}
