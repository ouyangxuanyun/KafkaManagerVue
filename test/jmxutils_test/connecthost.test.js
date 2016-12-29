var jmxobj = require('../../utils/jmxutils');
var expect = require('chai').expect;

describe('connecthost 函数测试', function () {
  it('connecthost（）函数返回数据类型是否为二维数组', function (done) {
    jmxobj.connecthost('VM-01', 9998, function (err,data) {
      expect(data).to.be.an('array');
      expect(data).to.have.length(6);
      expect(data[0]).to.have.length(4);
      done();
    })
  })

   // 下面测试自己想要测试的host和port> mocha connecthost.test.js VM-02 9998
  it('connecthost（）函数返回数据类型是否为二维数组', function (done) {
    jmxobj.connecthost(process.argv[3], process.argv[4], function (err,data) {
      expect(data).to.be.an('array');
      expect(data).to.have.length(6);
      expect(data[0]).to.have.length(4);
      done();
    })
  })


});
