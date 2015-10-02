var fs = require('fs');

var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised)

var should = chai.should()

var config = { 
  host: process.env.SFTPHOST || 'localhost', 
  port: process.env.SFTPPORT || 22, 
  username: process.env.SFTPUSER || 'vagrant', 
  password: process.env.SFTPPASS || 'vagrant'
};

var SFTPClient = require('../index');

var sftp = new SFTPClient(config);

var session = sftp.session(config).then(function(s) { session = s })

// read in test.dat to buffer
var buffer = fs.readFileSync('test/fixtures/test.dat');

describe('SFTPClient()', function () {
  it('new SFTPClient(config) should return SFTPClient', function () {
    var Client = new SFTPClient(config)
    Client instanceof SFTPClient
  })
  it('new SFTPClient(config).config should equal config', function () {
    var Client = new SFTPClient(config)
    Client.config.should.equal(config)
  })
  it('SFTPClient() should return SFTPClient instance', function () {
    var Client = SFTPClient()
    Client instanceof SFTPClient
  })
  it('stat("./") with invalid config should fail', function () {
    var Client = SFTPClient()
    return Client.stat("./").should.be.rejected
  })
})

describe('session(config)', function () {
  it('session(config) should return valid session', function () {
    return sftp.session(config).should.be.fulfilled
  })
  it('session() should be rejected', function () {
    return sftp.session().should.be.rejected
  })
  it('stat("./", session) should be fullfilled', function(){
    return sftp.session(config).then(function (session) {
      return sftp.stat('./', session)
    }).should.be.fulfilled
  })
})

describe('ls(path)', function () {
  it('ls("/") should return a valid directroy object', function () {
    return sftp.ls('./').should.eventually.contain({type: 'directory'})
  })
  it('should return a valid file object', function (){
    return sftp.ls('./.bash_profile').should.eventually.contain({type: 'file'})
  })
  it('ls("/dev/null") should be of type other', function () {
    return sftp.ls('/dev/null').should.eventually.contain({type: 'other'})
  })
  it('ls("./nonexistantfile") should reject', function() {
    return sftp.ls('somenonexistant.file').should.be.rejected
  })
})

describe('putBuffer(buffer, remote)', function(){
  it('put(buffer, "/tmp/test.dat") should transfer buffer', function () {
    return sftp.putBuffer(buffer, '/tmp/test.dat').should.eventually.be.true
  })
  it('put(buffer, "/unwritable") should transfer reject', function() {
    return sftp.putBuffer(buffer, '/unwritable').should.be.rejected
  })
})

describe('getBuffer(remote)', function () { 
  it('getBuffer("/tmp/test.dat") should tranfer file to buffer', function () {
    return sftp.getBuffer('/tmp/test.dat').then(function(rbuffer) { 
      return rbuffer.equals(buffer) 
    }).should.eventually.be.true
  })
  it('getBuffer("/nonexistantfile") should reject', function () {
    return sftp.getBuffer('/nonexistantfile').should.be.rejected
  })
})

describe('put(local, remote)', function () {
	it('should transfer local file to remote', function () {
    return sftp.put('test/fixtures/test.dat', '/tmp/test.dat').should.eventually.be.true
  })
  it('put("test/fixtures/test.dat", "/unwritable") shoule reject', function() {
    return sftp.put('test/fixtures/test.dat', '/unwritable').should.be.rejected
  })
  it('put("/nonexistantfile", "/tmp/test.dat") should reject', function() {
    return sftp.put('/nonexistantfile', '/tmp/test.dat').should.be.rejected
  })
})

describe('get(remote, local)', function () {
  it('should transfer remote file locally', function (){
    return sftp.get('/tmp/test.dat', '/tmp/transfertest.remove').should.eventually.be.true;
  })
  it('get("/tmp/test.dat", "/unwritable") should reject', function() {
    return sftp.get('/tmp/test.dat', '/unwritable').should.be.rejected
  })
  it('put("/nonexistantfile", "/tmp/test.dat") should reject', function() {
    return sftp.get('/nonexistantfile', '/tmp/test.dat').should.be.rejected
  })
})

describe('mv(source, dest)', function () {
	it('mv("/tmp/test.dat", "/tmp/test.mv.dat") should move a remote file', function () {
		return sftp.mv('/tmp/test.dat', '/tmp/test.mv.dat').should.eventually.be.true
	})
  it('mv("/tmp/nonexistant.file","/tmp/test.dat") should fail', function () {
    return sftp.mv('/tmp/nonexistant.file', '/tmp/test.dat').should.be.rejected
  })
  it('mv("/tmp/test.mv.dat", "/nonwritable/location" should fail', function () {
    return sftp.mv('/tmp/test.mv.dat','/cantwritehere').should.be.rejected
  })
})

describe('rm(path)', function () {
	it('should remove a remote file', function ( ){
		return sftp.rm('/tmp/test.mv.dat').should.eventually.be.true
	})
  it('rm("/tmp") should reject', function () {
    return sftp.rm('/tmp').should.eventually.rejected
  })
})

describe('stat(path)', function () {
  it('stat("/tmp") should be true', function () {
    return sftp.stat('/tmp').should.eventually.contain({type: 'directory'})
  })
  it('stat("./.bash_profile") should be file', function () {
    return sftp.stat('./.bash_profile').should.eventually.contain({type: 'file'})
  })
  it('stat("/dev/null") should be type other', function () {
    return sftp.stat('/dev/null').should.eventually.contain({type: 'other'})
  })
  it('stat("/root") should fail', function () {
    return sftp.stat('/root/.bashrc').should.be.rejected
  })
  it('stat("/nonexistantfile")', function () {
    return sftp.stat('/nonexistantfile').should.be.rejected
  })
})

describe('mkdir(path)', function () {
  it('mkdir("/tmp/testdir") should reslove', function () {
    return sftp.mkdir('/tmp/testdir').should.eventually.be.true
  })
  it('mkdir("/nonewritable") should reject', function () {
    return sftp.mkdir('/nowriteabledir').should.be.rejected
  })
})

describe('rmdir(path)', function () {
  it('rmdir("/tmp/testdir") should be true', function () {
    return sftp.rmdir('/tmp/testdir').should.eventually.be.true
  })
  it('rmdir("/tmp") should reject', function () {
    return sftp.rmdir('/tmp').should.be.rejected
  })
  it('rmdir("/nonexistentdir") should be rejected', function () {
    return sftp.rmdir('/noexistantdir').should.be.rejected
  })
})
