
var jmxobj = require('../../utils/jmxutils');
var zkutils = require('../../utils/zkutils');
var expect = require('chai').expect;

describe('getcombinedMetrics 函数测试', function () {
  it('测试zkutils的getBrokerList 函数', function (done) {
    zkutils.getBrokerList(function (err,BrokerList) {
      expect(BrokerList).to.be.an('array');
      expect(BrokerList.length).to.be.least(0);
      done();
    })
  });

  it('getcombinedMetrics（）函数返回数据类型是否为二维数组', function (done) {
    zkutils.getBrokerList(function (err,BrokerList) {
        jmxobj.getcombinedMetrics(BrokerList, function (err, combinedMetric) {
          expect(combinedMetric).to.be.an('array');
          if (BrokerList.length == 0) {
            expect(BrokerList).to.be.empty();
          } else {
            expect(combinedMetric).to.have.length(6);
          }
          done();
        })
    })
  })
})