# 基于 VRF 的分层PBFT共识机制优化（vrf+评分+分层）
李伟 祝建明 孟鑫宇
（浙江工业大学 计算机科学与技术学院，浙江 杭州 310000）
## 摘要
- 随着数字货币的发展和普及，区块链技术在世界范围内因为其可靠可信，逐渐成为炙手可热的新话题。而共识算法对区块链的适用环境和性能起着决定性的作用。目前，安全性和效率是考核共识算法的重要方面。
- 本文在联盟链环境中常用的PBFT改进算法分层PBFT的基础上，结合VRF和评分机制，对原有的分层PBFT算法进行改进，并与传统PBFT比较。
- ==实验和分析表明，优化后的 I（improved）PBFT 算法在安全性方面大大提升，并且在效率方面略微提升==（要量化）
- ，使得区块链技术在实际应用中拥有更加广阔的应用场景

## 关键字
PBFT VRF 区块链 共识算法 评分机制

## Study of Improved PBFT Consensus Mechanism Based on VRF
## 0. 引言（或许不要，只有第一章简介）

自2009年，随着比特币诞生，区块链技术开始在金融、物流、数字资产、供应链金融、跨境支付等多个领域不断探索。由于共识算法的限制，目前区块链系统存在着资源消耗过大以及交易时延较低等问题,限制了区块链的广泛应用。

## 1. 简介
作为最经典的状态机复制算法之一，实用的拜占庭容错算法（PBFT）[5]在联盟区块链平台上得到了高度的应用，并在此基础上提出了一系列改进算法。其中分层是一个比较常见的改进方案。分层的PBFT的模型如下图所示：

![image](https://s2.ax1x.com/2020/03/03/3hTJUK.png)

然而，它们仍然面临以下问题：

1. 分层PBFT的共识效率和安全性受到各个子区域中分主节点的是否作恶的极大影响。此外，各个分主节点的选择序列是规则的，因此新的主节点很容易被预测并受到恶意攻击。

2. 故障节点和作恶节点会破坏系统的效率和安全性。众所周知，这些基于BFT算法需要最少3f+1个节点才能容忍f个拜占庭错误。如果这些故障节点不能及时检测和移除，可能会串通破坏系统安全，但是传统的分层PBFT缺乏一些检测和移除它们的机制；

3.  在许多实际场景中，联盟成员的话语权是不同的。例如，股东在股东大会上有不同的话语权。通常大型机构或主导成员在投票过程中的发言权更大，因为它们比其他成员更可信，因此需要仔细考虑财团成员的声誉。但是，PBFT中的所有参与节点是完全平等的，不同的话语权不能通过信誉来体现，这不符合实际场景的要求；

针对上述问题，我们提出了一种基于信誉度的分层拜占庭容错算法，该算法融合了联盟区块链信誉度模型和封层PBFT的模型。

- 一方面，IPBFT可以通过VRF算法，充分随机的同时，结合节点的信誉度共同决定了该节点作为新的主节点或者子区域中的分主节点的概率，从而降低了整个系统的安全风险。
- 另一方面，算法可以恢复或去除识别出的故障节点，保持系统的高可用性；
- 此外，参与节点的信誉值可以作为判断节点话语权的标准，激励节点遵守协议。 


由于该系统能够保证各个主节点的安全性，恢复或去除识别出的故障节点，提高了正确节点的话语权，从而减少了改变一致状态的投票节点数，使得IPBFT在高故障率系统中取得了较好的性能。
具体而言，改进如下：
1.  我们设计了一个信誉模型来评估协商过程中每个节点的操作。通过其信誉值判断在接下去过程中的话语权；
2. 我们引入VRF算法结合信誉模型，设计了一个新的对于各个主节点的选择方法，提高了系统安全性；
3. 提出了IPBFT算法，在传统的分层PBFT的基础上，提高了系统安全性和对于而恶意节点的处理能力。
4. 我们构建了一个简单的区块链系统来模拟共识过程，并将IPBFT与其他共识算法在交易吞吐量、时延和故障节点率方面进行了比较。

结果表明，IPBFT能够有效地识别故障节点和安全的挑选各个主节点，在故障节点率较高的情况下，性能和安全性得到了提高。 

![IPBFT系统模型图]()

本文结构如下: 
- 第二节简述了区块链共识机制的现状和问题，VRF的定义，VRF在区块链中的应用，评分模型的简介; 具体介绍了分层PBFT共识机制及其存在的问题; ==（准备知识）==
- 第三节提出了FL-PBFT的共识机制优化方案 ;==（自己的方案）==
- 第四节对优化方案的安全性和性能进行了理论分析;==（方案分析）==
- 第五节构建了优化方案的原型系统, 对方案的性能进行了实验分析;==（针对上一章的分析，每个分析分别用实验验证）==
- 第六节对本文工作进行了总结。

# 2. 基础知识
## 2.1 分层PBFT共识机制
- 共识机制（重要性，作用，发展历史）
- PBFT（原理，机制，问题，流程示意图）
- 分层PBFT（原理，机制，问题，分层示意图）

## 2.2 评分机制（reputation mechanism）
- 没想好（一般的评分机制的作用和产生）
- 评分机制在区块链中的应用

## 2.3 VFR
- VRF来源，发展
- 自己的VRF设计（产生随机数）
- vrf子区块链中的应用

# 3. 系统模型
## 3.1 整体方案
- 一段介绍
- 流程示意图
- 简短介绍

## 3.2 方案(基本需要程序伪代码和示意图)
### pre-prepare stage
1. 评分机制的初始化(?，上下限。出现极限情况怎么办)
2. vrf产生随机数
3. 函数 功能在本机判断自己是否被选为代理节点(vrf 乘以 评分？)
4. 函数 根据自己是代理节点生成树结构
5. request消息传播方式

### reply stage
1. 收集投票结果消息传播方式，加权评分，获得最终共识
2. 评分机制跟新评分

### 新的节点加入和视图切换
1. 新的节点加入算法：若允许放入最近代理节点下，成为子节点，若不允许，触发视图切换
2. 视图切换：重新生成代理节点，更新评分

# 4.验证与分析
## 4.1 基础介绍 
- 原始分层PBFT的问题
    - 代理节点的选择简单，容易被攻击，而代理节点的对于系统安全十分重要
    - 对于通讯不良作恶节点的惩罚机制单一。

## 4.2 安全性
- 针对vrf的随机性说几句
- （公式推导）验证vrf够随机
- 配合评分机制，保护代理节点
- 总结比原方案将会在安全性方面大大提高

## 4.3 交易时延
- 一旦生成树建立，和普通分层PBFT没有区别
- 代理节点选举频繁程度（？选举周期多少）每次一个重新构建网络的时间
- 结论基本差不多，随着共识次数多起来，会快一点

## 4.4 交易速度（tps）
- 一旦生成树建立，和普通分层PBFT没有区别
- 评分机制将会减少通讯不良节点
- 结论基本差不多

## 4.5 通讯成本traffic
- 计算公式
- 差不多

## 4.6 容错性能
- 计算公式
- 差不多

# 5 实验验证
## 5.1 实验设计
- 硬件环境，软件环境
- 设计一个网络两层，每层7个 7x7+1=50个节点
- 示意图

## 5.2
### 安全性实验
- 16，18，20个作恶节点。重复作恶100次。系统公式成功次数以及最后状态。
- PBFT 分层PBFT 我们的算法，3个比较

### 交易速度实验
- TPS 没有作恶节点。共识节点数量10，100，1000时表现
- 比较

### 交易时延实验
- 作恶节点0.10.20 看时延变化
- 比较

### traffic
- 作恶节点0.10.20，直接作图

### 容错
- 作恶节点0.10.20，作图

# 6.结论