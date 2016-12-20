"use strict";
var express = require('express');
var router = express.Router();
var fs = require('fs');
var kafka = require('../utils/kafkautil');
var jmxutil = require('../utils/jmxutils');
var zkutil = require('../utils/zkutils');
var nodeutils = require('../utils/nodeutils')
var async = require('async');

var testInfo = require('../test/gettestInfo')
var AllCluster = [];
AllCluster.length = 1;  // 全局存储创建的cluster 信息
AllCluster['test111'] = testInfo(); //console.log(AllCluster["test111"])


var BrokerList = ''; //全局，提供给topic list页面 和 brokers页面
var BrokerList_Topic = [];//给topic页面连接信息
var BrokerNumber = 4;
var OriginBrokerList = [];

zkutil.getBrokerList(function (err, _BrokerList) {
  if (err) {
    console.log("get Original BrokerList Error");
    return console.log(new Error(err));
  } else {
    OriginBrokerList = _BrokerList;
  }
});

/*获取Broker的IP 端口等信息, 显示clusters list 信息， homepage页*/
router.get('/', function (req, res) {
  BrokerList = '';
  BrokerList_Topic = [];
  zkutil.getBrokerList(function (err, _BrokerList) {
    if (err) {
      console.log(" getBrokerList Error");
      return console.log(new Error(err));
    } else {
      BrokerList = _BrokerList;
      console.log('BrokerList');
      console.log(_BrokerList);
      for (var lnum = 0; lnum < BrokerList.length; lnum++) {
        !function (lnum) {
          var ltemp = [];
          ltemp.push(BrokerList[lnum][0]);
          ltemp.push(BrokerList[lnum][1]);
          ltemp.push(BrokerList[lnum][3]);
          BrokerList_Topic[lnum] = ltemp;
        }(lnum)
      }//console.log("________________________-");console.log(BrokerList_Topic)
    }
  });
  res.redirect('/pages/clusters.html');
  //use following to keep params
  //res.redirect('clusters.html'+req._parsedUrl.search);
});

router.get('/getclusters', function (req, res, next) {
  var clusters = [];
  for (var key in AllCluster) {
    var cluster = new Object();
    cluster.name = key;
    cluster.kafkaVersion = AllCluster[key]["kafkaVersion"];
    cluster.zkHosts = AllCluster[key]["zkHosts"];
    cluster.operation = AllCluster[key]["operation"];
    clusters.push(cluster);// console.log(cluster.name,cluster.kafkaVersion,cluster.zkHosts,cluster.operation);
  }
  res.send({clusters: clusters, Title: "Kafka Manager"})
});


/* 添加cluster页面*/
router.get('/addCluster', function (req, res, next) {
  res.redirect('/pages/addcluster.html');
});


/* 获取表单提交的数据处理后存入attresult 数组，详细见README/1.*/
var temp_clustername;
var modifyClusterTitle;
router.get('/clusters', function (req, res, next) {
  var checkedkey = ["logkafkaEnabled", "pollConsumers", "filterConsumers", "activeOffsetCacheEnabled", "displaySizeEnabled"];
  var attresult = [];
  var attsjson = req.query;// console.log("!!!!!!!!!!!!" );console.log(req)
  var clustername = req.query.name
  attresult["clustername"] = clustername;
  attresult["zkHosts"] = attsjson.zkHosts; //因为zkHost里面有：，会影响下面继续以：为分隔符进行分割，先保存
  var attsstr = JSON.stringify(attsjson);//console.log(attsstr)
  var arrs = attsstr.slice(1, -1).split(",");
  for (var i = 2; i < arrs.length; i++) {
    var temp = arrs[i].split(":");
    attresult[temp[0].slice(1, -1)] = temp[1].slice(1, -1)
  }
  for (var j = 0; j < checkedkey.length; j++) {
    !function (j) {
      if (attresult.hasOwnProperty(checkedkey[j])) {
        attresult["check_" + checkedkey[j]] = "true";
      } else {
        attresult["check_" + checkedkey[j]] = "false";
      }
    }(j)
  }//console.log(attresult);
  AllCluster[attresult["clustername"]] = attresult;
  AllCluster.length++;
  temp_clustername = clustername;
  modifyClusterTitle = "Add Cluster"
  res.redirect('/pages/changeclusterresult.html');
});
router.get('/get_ChangeClusterResult', function (req, res, next) {
  res.send({title: modifyClusterTitle, clustername: temp_clustername});
});


/*每个cluster详情页*/
router.get('/clusters/:clustername', function (req, res, next) {
  var clusterInfoname = req.params.clustername;
  res.redirect('/pages/clusterInfo.html');
  temp_clustername = clusterInfoname;
});
router.get('/get_ClusterInfo', function (req, res, next) {
  zkutil.getbrokernumbers(function (err, bronum) {
    if (err) {
      return console.log(new Error(err));
    }
    kafka.getlistlen(function (listlen) {
      res.send({
        clusterInfoname: temp_clustername,
        listlen: listlen,
        bronum: bronum,
        zkHosts: AllCluster[temp_clustername]['zkHosts'],
        Version: AllCluster[temp_clustername]['kafkaVersion']
      });
    });
  })
});


/*Cluster Modify 页面 */
var modifyname, originInfo;
router.get('/updateCluster', function (req, res, next) {
  console.log(req.query.c);//获取要修改的cluster name
  modifyname = req.query.c;
  originInfo = AllCluster[req.query.c];
  res.redirect('/pages/updateCluster.html');
});
router.get('/get_updateCluster', function (req, res, next) {
  res.send({
    modifyname: modifyname,
    clustername: originInfo['clustername'],
    zkHosts: originInfo['zkHosts'],
    kafkaVersion: originInfo['kafkaVersion'],
    jmxEnabled: originInfo['jmxEnabled'],
    jmxUser: originInfo['jmxUser'],
    jmxPass: originInfo['jmxPass'],
    logkafkaEnabled: originInfo['logkafkaEnabled'],
    pollConsumers: originInfo['pollConsumers'],
    filterConsumers: originInfo['filterConsumers'],
    activeOffsetCacheEnabled: originInfo['activeOffsetCacheEnabled'],
    displaySizeEnabled: originInfo['displaySizeEnabled'],
    'tuning.brokerViewUpdatePeriodSeconds': originInfo['tuning.brokerViewUpdatePeriodSeconds'],
    'tuning.clusterManagerThreadPoolSize': originInfo['tuning.clusterManagerThreadPoolSize'],
    'tuning.clusterManagerThreadPoolQueueSize': originInfo['tuning.clusterManagerThreadPoolQueueSize'],
    'tuning.kafkaCommandThreadPoolSize': originInfo['tuning.kafkaCommandThreadPoolSize'],
    'tuning.kafkaCommandThreadPoolQueueSize': originInfo['tuning.kafkaCommandThreadPoolQueueSize'],
    'tuning.logkafkaCommandThreadPoolSize': originInfo['tuning.logkafkaCommandThreadPoolSize'],
    'tuning.logkafkaCommandThreadPoolQueueSize': originInfo['tuning.logkafkaCommandThreadPoolQueueSize'],
    'tuning.logkafkaUpdatePeriodSeconds': originInfo['tuning.logkafkaUpdatePeriodSeconds'],
    'tuning.partitionOffsetCacheTimeoutSecs': originInfo['tuning.partitionOffsetCacheTimeoutSecs'],
    'tuning.brokerViewThreadPoolSize': originInfo['tuning.brokerViewThreadPoolSize'],
    'tuning.brokerViewThreadPoolQueueSize': originInfo['tuning.brokerViewThreadPoolQueueSize'],
    'tuning.offsetCacheThreadPoolSize': originInfo['tuning.offsetCacheThreadPoolSize'],
    'tuning.offsetCacheThreadPoolQueueSize': originInfo['tuning.offsetCacheThreadPoolQueueSize'],
    'tuning.kafkaAdminClientThreadPoolSize': originInfo['tuning.kafkaAdminClientThreadPoolSize'],
    'tuning.kafkaAdminClientThreadPoolQueueSize': originInfo['tuning.kafkaAdminClientThreadPoolQueueSize'],
    check_logkafkaEnabled: originInfo['check_logkafkaEnabled'],
    check_pollConsumers: originInfo['check_pollConsumers'],
    check_filterConsumers: originInfo['check_filterConsumers'],
    check_activeOffsetCacheEnabled: originInfo['check_activeOffsetCacheEnabled'],
    check_displaySizeEnabled: originInfo['check_displaySizeEnabled']
  });
});


/* Clusters 页面增删改  Modify/Disable/Enable/Delete,　update页面save按钮 或者Cluster页面Disable，Enable，Delete按钮*/
router.post('/clusters/:clustername', function (req, res, next) {
  var clustername = req.body.name;
  var checkedkey = ["logkafkaEnabled", "pollConsumers", "filterConsumers", "activeOffsetCacheEnabled", "displaySizeEnabled"];
  var attsjson = req.body;
  var changedInfo = AllCluster[clustername];//console.log(changedInfo);

  if (req.body.operation == "Update") {//console.log("Update 提交了表单");
    changedInfo["operation"] = "Update";
    changedInfo["zkHosts"] = attsjson.zkHosts;
    var attsstr = JSON.stringify(attsjson);//console.log("转成字符串" + attsstr)
    var arrs = attsstr.slice(1, -1).split(",");//console.log("分割成数组" + arrs)
    for (var j = 0; j < checkedkey.length; j++) {// console.log("删除已经加入的checked");
      changedInfo["check_" + checkedkey[j]] = "false";
    }
    for (var i = 3; i < arrs.length; i++) { //要从zkHost后一位开始以：分割，此时zhHosts的位置是2,
      var temp = arrs[i].split(":");
      var key = temp[0].slice(1, -1);
      var value = temp[1].slice(1, -1);
      changedInfo[key] = value;
      if (checkedkey.indexOf(key) > -1) {// console.log("有checked 选项" + key)
        changedInfo["check_" + key] = "true";
      }
    }
    modifyClusterTitle = "Update Cluster";
    temp_clustername = clustername;
    res.redirect('/pages/changeclusterresult.html');
  }

  if (req.body.operation == "Disable") {//console.log("Disable 提交了表单");
    changedInfo["operation"] = "Disable"
    modifyClusterTitle = "Disable Cluster";
    temp_clustername = clustername;
    res.redirect('/pages/changeclusterresult.html');
  }

  if (req.body.operation == "Enable") {//console.log("Enable 提交了表单");
    changedInfo["operation"] = "Enable";
    modifyClusterTitle = "Enable Cluster";
    temp_clustername = clustername;
    res.redirect('/pages/changeclusterresult.html');
  }

  if (req.body.operation == "Delete") {//console.log("Delete 提交了表单");
    delete(AllCluster[clustername]);
    modifyClusterTitle = "Delete Cluster";
    temp_clustername = clustername;
    res.redirect('/pages/changeclusterresult.html');
  }
})


var topic_name;
/* GET topic list page. */
router.get('/clusters/:clustername/topics', function (req, res, next) {
  temp_clustername = req.params.clustername;
  res.redirect('/pages/topicList.html');
});

/* GET topic list data. */
router.get('/getTopicList', function (req, res, next) {
  //var clustername = 'test';
  //console.log('-------'+clustername);
  var topicList = new Array();
  var result = new Object();

  kafka.getTopicList(function (err, t_data) {
    if (err) {
      return console.log(new Error(err));
    }
    var brokers = t_data.brokerList.length;
    //console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~brokers num ' + brokers +', list '+t_data.brokerList)
    jmxutil.getJMXdata(BrokerList_Topic, brokers, t_data.topicList, function (err, jmx_data) {
      if (err) {
        return console.log(new Error(err));
      }
      async.each(jmx_data, function (jmx_item, callback) {
        var topic_name = jmx_item.topic;
        kafka.getTopicSummary(topic_name, function (err, ts_data) {
          if (err) {
            return console.log(new Error(err));
          }
          ts_data.offset = jmx_item.end_offset;
          ts_data.unserReplicated = Math.floor(jmx_item.under_replicas * 100 / ts_data.partitions);
          ts_data.producerMsg = jmx_item.metrics.MessagesInPerSec[0];
          ts_data.b_spr_class = '';
          ts_data.b_skw_class = '';
          ts_data.u_rpl_class = '';
          if (ts_data.brokerSpread <= 50) ts_data.b_spr_class = 'danger';
          else if (ts_data.brokerSpread < 100) ts_data.b_spr_class = 'warning';
          if (ts_data.brokerSkewed >= 50) ts_data.b_skw_class = 'danger';
          else if (ts_data.brokerSkewed > 0) ts_data.b_skw_class = 'warning';
          if (ts_data.unserReplicated >= 50) ts_data.u_rpl_class = 'danger';
          else if (ts_data.unserReplicated > 0) ts_data.u_rpl_class = 'warning';
          topicList.push(ts_data);
          //console.log('~~~~~~\n');
          //console.log(ts_data);
          callback();
        })
      }, function (err) {
        if (err) {
          return console.log(new Error(err));
        }
        console.log('==========' + temp_clustername)
        result.topicList = topicList;
        result.clusters = temp_clustername;
        res.send(result);
      })
    })
  });
});

/* GET topic details page. */
router.get('/clusters/:clustername/topics/:topic_name', function (req, res, next) {
  temp_clustername = req.params.clustername;
  topic_name = req.params.topic_name;
  res.redirect('/pages/topicDetails.html');
});

/* GET each topic details . */
router.get('/getTopicDetails', function (req, res, next) {
  var topicdetails = new Object();
  var result = new Object();
  kafka.getTopicSummary(topic_name, function (err, ts_data) {
    if (err) {
      return console.log(new Error(err));
    }
    jmxutil.getTopicJMXdata(BrokerList_Topic, ts_data.brokers, topic_name, function (err, jmx_data) {
      if (err) {
        return console.log(new Error(err));
      }
      zkutil.filterconsumers(topic_name, function (err, consumers) { //一维数组，Consumers consuming from this topic的结果
        //console.log(consumers);
        if (err) {
          return console.log(new Error(err));
        }
        for (var i = 0; i < ts_data.partitions_list.length; i++) {
          ts_data.partitions_list[i].p_offset = 0;
          for (var j = 0; j < jmx_data.logEndPartition_arr.length; j++) {
            if (jmx_data.logEndPartition_arr[j].partition == ts_data.partitions_list[i].parition_id) {
              ts_data.partitions_list[i].p_offset = jmx_data.logEndPartition_arr[j].end_offset
            }
          }
        }
        for (var i = 0; i < ts_data.partitions_list.length; i++) {
          ts_data.partitions_list[i].u_r_flag = false;
          for (var j = 0; j < jmx_data.underReplicated_arr.length; j++) {
            if (jmx_data.underReplicated_arr[j].partition == ts_data.partitions_list[i].parition_id) {
              if (jmx_data.underReplicated_arr[j].under_replicated) ts_data.partitions_list[i].u_r_flag = true
            }
          }
        }

        topicdetails.offset = jmx_data.end_offset;
        topicdetails.under_replicated = Math.floor(jmx_data.under_replicated * 100 / ts_data.partitions);
        topicdetails.underReplicated_arr = jmx_data.underReplicated_arr;

        ts_data.b_spr_class = '';
        ts_data.pr_rpl_class = '';
        ts_data.b_skw_class = '';
        ts_data.u_rpl_class = '';
        if (ts_data.brokerSpread <= 50) ts_data.b_spr_class = 'danger';
        else if (ts_data.brokerSpread < 100) ts_data.b_spr_class = 'warning';
        if (ts_data.prefferedReplicas <= 50) ts_data.pr_rpl_class = 'danger';
        else if (ts_data.prefferedReplicas < 100) ts_data.pr_rpl_class = 'warning';
        if (ts_data.brokerSkewed >= 50) ts_data.b_skw_class = 'danger';
        else if (ts_data.brokerSkewed > 0) ts_data.b_skw_class = 'warning';
        if (topicdetails.under_replicated >= 50) ts_data.u_rpl_class = 'danger';
        else if (topicdetails.under_replicated > 0) ts_data.u_rpl_class = 'warning';
        console.log("=======")
        console.log(ts_data)

        topicdetails.logPartition_arr = jmx_data.logEndPartition_arr;//console.log(topicdetails.logPartition_arr)
        topicdetails.metrics = jmx_data.metrics;
        topicdetails.topicSummary = ts_data;

        result.topicdetails = topicdetails;
        result.clustername = temp_clustername;
        result.topic_name = topic_name;
        result.consumers = consumers;
        res.send(result);
      })
    })
  });
});

/* GET　topic create page. */
router.get('/clusters/:clustername/createTopic', function (req, res, next) {
  temp_clustername = req.params.clustername;
  res.redirect('/pages/createTopic.html');
});

/* GET　topic create info. */
router.get('/getCreateTopic', function (req, res, next) {
  res.send(temp_clustername);
});

/* GET topic create result page. */
router.get('/clusters/:clustername/createResult', function (req, res, next) {
  temp_clustername = req.params.clustername;
  topic_name = req.query.topic;
  res.redirect('/pages/createTopicResult.html');
});

/* GET topic create result. */
router.get('/getCreateTopicResult', function (req, res, next) {
  var result = new Object();
  nodeutils.createTopic(topic_name, function (err) {
    if (err) {
      return console.log(new Error(err));
    }
    result.topic_name = topic_name;
    result.clustername = temp_clustername;
    res.send(result);
  })
});

/* Broker list 页面*/
router.get('/clusters/:clustername/brokers', function (req, res, next) {
  temp_clustername = req.params.clustername;
  res.redirect('/pages/brokers.html');
});
router.get('/get_Brokers', function (req, res, next) {
  zkutil.getBrokerList(function (err, _BrokerList) {
    if (err) {
      return console.log(new Error(err));
    }
    BrokerList = _BrokerList;
    jmxutil.getcombinedMetrics(BrokerList, function (err, combinedMetrics) {
      if (err) {
        return console.log(new Error(err));
      }

      var aliveBrokerIds = [];
      var OriginBrokerIds = [];
      for (var j = 0; j < BrokerList.length; j++) {
        aliveBrokerIds.push(Number(BrokerList[j][0]));
      }
      for (var i = 0; i < OriginBrokerList.length; i++) {
        OriginBrokerIds.push(OriginBrokerList[i][0]);
      }
      for (var k = 0; k < BrokerList.length; k++) {
        if (OriginBrokerIds.indexOf(BrokerList[k][0]) == -1) {
          OriginBrokerList.push(BrokerList[k]);
        }
      }

      OriginBrokerList.sort(compare(0));
      res.send({
        clustername: temp_clustername,
        combinedMetrics: combinedMetrics,
        BrokerList: BrokerList,
        OriginBrokerList: OriginBrokerList,
        aliveBrokerIds: aliveBrokerIds
      })
    });
  });
});


router.get('/get_BrokersChart', function (req, res, next) {
  kafka.listTopics(function (topiclist) {
    kafka.getBrotoPartiPerTopic(BrokerList, topiclist, function (err, data) {
      var series1 = [];
      var categories = [];
      for (var i = 0; i < data.length; i++) {//按照topic循环
        !function (i) {
          var topicdataarr = new Object();
          topicdataarr.data = [];
          topicdataarr.name = data[i].name;
          for (var id = 0; id < BrokerList.length; id++) {
            var dataarr = [];
            dataarr.push(Number(BrokerList[id][0]) + (Math.random() - 0.5) / 2);
            // dataarr.push(id  + (Math.random()-0.5)/2);
            categories.push('Broker: ' + BrokerList[id][0]);
            dataarr.push(Math.round(400 * Math.random()));
            dataarr.push(data[i].partitionLen[BrokerList[id][0]]);
            topicdataarr.data.push(dataarr)
          }
          series1.push(topicdataarr);
        }(i)
      }
      res.send({chart1: series1, clustername: temp_clustername, categories: categories, broker_num: BrokerNumber})
    })
  })
});

/*Broker 详细页面 async方法*/
var brokerlistId;
router.get('/clusters/:clustername/brokers/:brokerlistId', function (req, res, next) {
  temp_clustername = req.params.clustername;
  brokerlistId = req.params.brokerlistId;
  res.redirect('/pages/brokerInfo.html');
});
router.get('/get_BrokerDetail', function (req, res, next) {
  var Info = findBrokerInfo(brokerlistId);
  console.log(Info)
  var broid = Info[0];
  var host = Info[1];
  var port = Info[2];
  async.parallel([
      function (cb) {
        jmxutil.getcombinedMetrics(BrokerList, cb) //calback(combinedMetrics)
      },
      function (cb) {
        jmxutil.connecthost(host, port, cb);// callback(metrics)
      },
      function (cb) {
        kafka.listTopics(function (allist) {
          kafka.listTopicPartitions(broid, allist, cb)// callback(topiclistdetail)
        })
      },
      function (cb) {
        jmxutil.getCPUMetric(host, port, cb);// callback(prosysCPU)
      }
    ],
    function (err, results) {
      if (err) {
        return console.log('async error' + err);
      }
      res.send({
        clustername: temp_clustername,
        brokerlistId: broid,
        InOutMessage: results[0],
        brokerMetric: results[1],
        topiclistdetail: results[2],
        prosysCPU: [Number(results[3][0].toFixed(2)), Number(results[3][1].toFixed(2))]
      })
    });
})

/* Consumers List 页面 */
router.get('/clusters/:clustername/consumers', function (req, res) {
  temp_clustername = req.params.clustername;
  res.redirect('/pages/consumerlist.html');
});
router.get('/get_ConsumerList', function (req, res) {
  zkutil.getAllConsumeInfo(function (allconsumeInfo) {//console.log(allconsumeInfo)
    res.send({clustername: temp_clustername, allconsumeInfo: allconsumeInfo})
  })
});


/* Consumed Topic Information 页面 */
var temp_consumergp;
router.get('/clusters/:clustername/consumers/:consumergp/type/ZK', function (req, res) {
  temp_clustername = req.params.clustername;
  temp_consumergp = req.params.consumergp;
  res.redirect('/pages/consumedTopicInfo.html');
});
router.get('/get_ConsumedTopicInfo', function (req, res) {
  res.render({clustername: temp_clustername, consumergp: temp_consumergp})
});


/* Topics it consumes from 链接页面 */
var temp_consumerTopic
router.get('/clusters/:clustername/consumers/:consumergp/topic/:consumerTopic/type/ZK', function (req, res) {
  temp_clustername = req.params.clustername;
  temp_consumergp = req.params.consumergp;
  temp_consumerTopic = req.params.consumerTopic;
  res.redirect('/pages/consumer_topic.html');
});


router.get('/get_ConsumTopicInfo', function (req, res) {
  var allInfo = [];
  nodeutils.getPartitionOffset(temp_consumerTopic, function (err, Partition_LogSize) {
    if (err) {
      return console.log("getPartitionOffset" + new Error(err))
    }
    zkutil.getConsumerOffset(temp_consumergp, temp_consumerTopic, function (err, ConsumerOffset) {
      if (err) {
        return console.log("getConsumerOffset" + new Error(err))
      }
      zkutil.getInstanceOwner(temp_consumergp, temp_consumerTopic, function (err, InstanceOwner) {
        if (err) {
          return console.log(new Error(err))
        }
        var instancenum = 0;
        var totalLag = 0;
        for (var i = 0; i < Partition_LogSize.length; i++) { //i代表partition
          var rowInfo = [];
          rowInfo[0] = i;
          rowInfo[1] = Partition_LogSize[i];
          rowInfo[2] = (ConsumerOffset[i] == undefined) ? 0 : ConsumerOffset[i];
          rowInfo[3] = rowInfo[1] - rowInfo[2];
          totalLag += rowInfo[3];
          if (InstanceOwner[i] == undefined) {
            rowInfo[4] = "None";
          } else {
            rowInfo[4] = InstanceOwner[i];
            instancenum++;
          }
          allInfo[i] = rowInfo;
        }//console.log(allInfo)
        var percentage = 100 * (instancenum / Partition_LogSize.length).toFixed(2)
        var chart1 = [];
        var chart2 = [];
        for (var num = 0; num < allInfo.length; num++) {
          var chart1temp = [];
          var chart2temp = [];
          chart1temp.push('Partition ' + allInfo[num][0]);
          chart1temp.push(Number(allInfo[num][2]));
          chart1.push(chart1temp);
          chart2temp.push('Partition ' + String(allInfo[num][0]));
          chart2temp.push(Number(allInfo[num][2]));
          chart2temp.push(Number(allInfo[num][1]) + Number(allInfo[num][2]));
          chart2.push(chart2temp);
        }
        res.send({
          clustername: temp_clustername,
          consumergp: temp_consumergp,
          consumerTopic: temp_consumerTopic,
          totalLag: totalLag,
          percentage: percentage,
          allInfo: allInfo,
          chart1: chart1,
          chart2: chart2
        })
      });
    });
  });
});

function findBrokerInfo(brokerlistId) {
  for (var i = 0; i < BrokerList_Topic.length; i++) {
    if (BrokerList_Topic[i] != null && BrokerList_Topic[i] != undefined) {
      if (BrokerList_Topic[i][0] == brokerlistId) {
        return BrokerList_Topic[i]
      }
    }
  }
  return undefined;
}
function compare(property) {
  return function (a, b) {
    var value1 = a[property];
    var value2 = b[property];
    return value1 - value2;
  }
}

module.exports = router;
