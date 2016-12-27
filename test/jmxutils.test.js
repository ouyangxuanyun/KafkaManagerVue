// jmxutil.connecthost = connecthost;
// jmxutil.getcombinedMetrics = getcombinedMetrics;
// jmxutil.getCPUMetric = getCPUMetric;

var jmxobj = require('../utils/jmxutils');
var expect = require('chai').expect;

describe('connecthost 函数测试', function () {
  it('callback 返回数据类型是否为二维数组', function (done) {
    jmxobj.connecthost('VM-01', 9998, function (err,data) {
      expect(data).to.be.an('array');
      expect(data.length).to.be.equal(6);
      expect(data[0].length).to.be.equal(4);
      done();
    })
  })



})
