# T-PBFT: An EigenTrust-Based Practical Byzantine Fault Tolerance Consensus Algorithm

标签（空格分隔）： 未分类

---

## abstract
blockchain is good;
consensus algorithm is important;
PoS,PoW is sucks;
**absolute finality** such as PBFT,HoneyBadgerBFT meet the scalability in a largescale network;
we propose a novel optimized PBFT,called T-PBFT,based on EigenTrust model,muli-stage consensus algorithm;
- 计算节点信任值，根据交易。选择出一个consensus group
- 为了减少view切换，只是替换一个single primary node，primary group中。
- 通过group signature和mutual supervision（相互监督），加强primary group的鲁棒性
设计实验，比较其他BFT算法，验证错误容忍率提高，减少了view的切换和通信的复杂度

## 1. instruction
blockchain 是分布式账本
分布式账本，加密算法，共识协议，智能合约等技术的大融合
提供了透明，安全，可靠，不可修改
分为公链，联盟链，私有链，其中后两个被称为permission blockchain
公链主要以挖矿为主，没有限制条件，对于读，写，认证，例如
私有链的读写操作都是由一个中心化的，被信任的节点完成，例如
联盟链是多中心，节点的操作必须被授权，例如
现今，区块链被应用在加密货币，数字支持（非金融体系，如能源，医疗，教育，供应链）

共识协议是核心，有效性和扩展性
有几个基础属性：
- consistency：一致性，最后都会得到一个结果
- validity：有效性，最终决定的区块，是被其中一个共识节点提出的
- liveness：也可以叫termination，可用性，每个普通节点都最终要选择一个区块（所有的过程都在有限的时间内得到，不能无限等待）
这些性质决定了xxx
根据这些性质的不通，大致可以将市面上的共识机制分为两类
- PoX（W，S），总是在公链上
- 类BFT （Practical BFT (PBFT)[20], Scalable BFT [21], Zyzzyva [22], HoneyBadgerBFT [23]），总是在联盟链上。
**现存的BFT算法，都有低扩展性的问题，如PBFT通信复杂度n^2,错误节点会使得view change，影响整个共识过程**

在本文中，我们提出了一个TPBFT，将共识算法的参与范围缩小到一个group，都有较高的信任值。
为了得到合适的group。Biryukov et al.[24] proposed a reputation module Guru to select the committee
based on the outcomes of consensus rounds.但是他们没有考虑到xxx
我们的模型考虑了 takes transaction relationship and ratings
通过将primary中的节点的替换操作，减少了视图切换的几率
最后分析细节和实验比较了算法。
**总结**
- 提出模型，能够排除坏节点，缩小参与共识的范围
- 整个共识过程，重新排布，新增信任值计算，共识group建立，共识流程
- 比较分析

下文：
第二节，相关工作
第三节，TPBFT的初步介绍
第四节，系统框架
第五节，设计流程关于TPBFT
第六节，比较
第七节，总结

## 2. related work

> **概率性确定（Probabilistic Finality）**
是基于区块链的协议提出的确定性类型（例如，比特币的中本聪共识）。在概率性确定中，包含交易的区块在链上埋得越深，该交易被撤销的可能性越低。因为某一区块后面的区块越多，包含该区块的（分叉）链就越可能是最长的链。 这就是为什么建议等到包含交易的区块在比特币区块链的深度为 6 个区块时才能确认交易完成（大约需要 1 小时），因为此时撤销交易的可能性非常低。

> **绝对性确定（Absolute Finality）**
是基于拜占庭容错（PBFT）的协议（例如 Tendermint）提出的确定性类型。在绝对性确定中，一旦交易被包含在区块中并添加到区块链上，该交易就会被立即视为最终确定。在这种情况下，一个验证者会先提出一个区块，而这个区块必须获得委员会中足够多验证者的认可才能提交到区块链上。

> **经济确定性（Economic Finality）**，也就是说撤销区块所需的资金成本非常高。在使用罚没机制的权益证明基础系统（例如 Casper FFG，Tendermint）中，如果权益持有者在两个（校注：相同高度的）区块上都签了名，那么他们所有的权益都会被没收，这就是损害确定性的昂贵代价。例如，一个有 100 位权益持有者的网络，每位权益持有者持有价值 100 万美元的权益，那么整个网络一共有价值 1 亿美元的权益。 如果有两个区块出现在区块链的同一高度，命名为 B 和 B’，此时 B 获得了 66％ 的权益持有者的投票（6600万美元），B’ 也获得了 66％ 的投票（6600万美元），那么 B 和 B’ 的交集（至少有 33％ 恶意的权益持有者）将失去他们所有的权益（至少 3300 万美元）。

## 3. PRELIMINARIES
### 3.1 PBFT
流程图
说明各个阶段
### 3.2 EigenTrust Model
#### 动态性；时间衰减性；上下文相关性；可度量性；单向性；
#### 动态计算节点全局信任值的模型
- 原先应用在P2P网络中，解决恶意节点的作恶行为
- 目标： 标记坏节点，避免从这些节点下载文件
- 方法：通过这些节点过去的表现，给与trust value
- 三方面： past history;friends of friends;eigentrust
- 主要参数 
    - 本地信任值 Cij：i节点对于j的评分，基于过去的表现（非负数，所有c相加等于1）
        - 每次成功的i->j的交易，cij增加
        - 每次失败的，作恶的交易，减少
    - 全局信任值 Ti ：整个网络对于节点I的评分
- 步骤： 
    - 对于自己交易过得节点，通过Past History，给与初始的Cij
    - 向你的朋友请求他的 Cij向量（Friends of Friends），通过权重相加cik= sigema（cij*Cjk）
- 问题:
    - 朋友太多，需要计算很多
    - 朋友太少，没有多少数据
- 解决的事情：
    - 通晓所有节点
    - 计算量尽量少，还有存储量
- 方法
    - t=（cT）^n*Ci(一次就是问自己的朋友，两次就是问朋友的朋友，一直问直到收敛)
    - 由整个网络维护这个东西，单个节点不需要这个工作
- 非去中心化方案：
    - 初始化 t = 1/n
    - 迭代 t = cT*t,直到t收敛
- 去中心化方案（整个网络会有群聚效果，好的节点抱团，坏的节点抱团，中间交流减少）
    - 计算一次，广播一次，等待反馈
    - 迭代上诉行为，直至收敛
- 其他辅助措施
    - 设立系统推荐值
    - 采用多元化指标评定行为
    - 对信任分低的节点的处罚
    - 处理更多的作弊行为，如摇摆，间谍，抱团恶意节点
    
## 4. SYSTEM  OVERVIEW
### 4.1 T-PBFT
3个阶段：
- 节点信任值计算
- 共识组的建立（区分 核心参加共识的成员 和 不参与的成员）
- 共识过程
### 4.2 假设（Assumptions）
- 行为一致性 （好的节点默认做好事）
- 有限的交易时间（交易的时间有限制（我认为是不能无限等待的意思））（为了方便计算EigenTrust模型的有效性）
## 5. TPBFT过程（Process）
### 5.1 节点信任值计算
- 初始化每个节点初始值 1/n
- 计算两个值，
    - direct trust vlalu。 直接值
        - 由两个节点之间的一次交易，sat（满意）值+1。sat-unsat等于对于一个节点的满意度。标准化，使所有满意度相加为1
    - Recommended trust value。建议值
        - 通过中间朋友计算没有交易过的节点之间的信任值
    - Recommended trust value。国际值
        - 循环迭代，问朋友的朋友，直到收敛 


