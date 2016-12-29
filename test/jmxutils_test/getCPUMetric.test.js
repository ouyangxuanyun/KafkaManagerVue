var jmxobj = require('../../utils/jmxutils');
var expect = require('chai').expect;

describe('getCPUMetric 函数测试', function () {
  it('getCPUMetric()函数返回数据类型是否为一维数组', function (done) {
    jmxobj.getCPUMetric('VM-01', 9998, function (err,data) {
      expect(data).to.be.an('array');
      expect(data.length).to.be.equal(2);
      done();
    })
  })
});
