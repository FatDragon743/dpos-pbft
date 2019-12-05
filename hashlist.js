/**
 * chain节点结构体
 * @param {*} data 
 */
function ListNode(data) {
  this.next = null;
  this.prev = null;
  this.data = data;
}
/**
 * chainList结构体
 */
function HashList() {
  this.head_ = null;
  this.tail_ = null;
  this.size_ = 0;
  this.map_ = {};
}

/**
 * 返回size
 */
HashList.prototype.size = function () {
  return this.size_;
};
/**
 * 添加新节点
 * 如果 链表为空
 *    添加新节点，头=尾=新节点
 * 如果 头=尾（长度为1）
 *    添加新节点，头的下一个为新节点，尾=新节点
 * 都不是
 *    正常顶替尾结点
 * size++
 */
HashList.prototype.add = function (key, value) {
  var newNode = new ListNode(value);
  this.map_[key] = newNode;
  if (this.head_ === null) {
    this.head_ = this.tail_ = newNode;
  } else if (this.head_ === this.tail_) {
    this.head_.next = newNode;
    newNode.prev = this.head_;
    this.tail_ = newNode;
  } else {
    this.tail_.next = newNode;
    newNode.prev = this.tail_;
    this.tail_ = newNode;
  }
  this.size_++;
};
/**
 * 通过 hash 寻找 block
 */
HashList.prototype.get = function (key) {
  var node = this.map_[key];
  if (node) {
    return node.data;
  } else {
    return null;
  }
};
/**
 * 删除节点
 */
HashList.prototype.remove = function (key) {
  var node = this.map_[key];
  if (node) {
    var prev = node.prev;
    var next = node.next;
    if (prev) {
      prev.next = next;
    }
    if (next) {
      next.prev = prev;
    }
    if (node === this.head_ && node === this.tail_) {
      this.head_ = this.tail_ = null;
    } else if (node === this.tail_) {
      this.tail_ = prev;
    } else if (node === this.head_) {
      this.head_ = next;
    }
    delete this.map_[key];
    this.size_--;
    return node.data;
  }
  return null;
};
/**
 * pop节点，，，真的用的到吗
 */
HashList.prototype.pop = function () {
  if (!this.head_) {
    return null;
  }
  this.size_--;
  var head = this.head_;
  if (this.head_ === this.tail_) {
    this.head_ = this.tail_ = null;
    return head.data;
  } else {
    this.head_ = this.head_.next;
    this.head_.prev = null;
    return head.data;
  }
};
/**
 * 选择节点返回，node.data
 * offset int 偏移
 * limit  int 个数限制
 * reverse bool 从头还是尾巴
 */
HashList.prototype.select = function (offset, limit, reverse) {
  var result = [];
  if (limit <= 0) {
    return result;
  }

  var node = reverse ? this.tail_ : this.head_;
  while (node && offset > 0) {
    if (reverse) {
      node = node.prev;
    } else {
      node = node.next;
    }
    offset--;
  }
  while (node && limit > 0) {
    result.push(node.data);
    if (reverse) {
      node = node.prev;
    } else {
      node = node.next;
    }
    limit--;
  }
  return result;
};
/**
 * each  循环节点 callback模式
 * first 返回head节点
 * last  返回tail节点
 */
HashList.prototype.each = function (cb) {
  var node = this.head_;
  var i = 0;
  while (node) {
    cb(node.data, i++);
    node = node.next;
  }
};

HashList.prototype.first = function () {
  if (this.head_) {
    return this.head_.data;
  }
  return null;
}

HashList.prototype.last = function () {
  if (this.tail_) {
    return this.tail_.data;
  }
  return null;
}

module.exports = HashList;
