var worked = require('../')
var assert = require('assert')

var Queue = require('../lib/queue')
var queueName = 'test' + Date.now()

describe('worker', function() {
  before(function(done) {
    Queue.delete(queueName, function(err) {
      var options = {
      }
      Queue.create(queueName, options, done)
    })
  })

  it('works', function(done) {
    var worker = worked.worker(queueName, function(job) {
      done('should not call work callback with no jobs')
    })
    worker.on('idle', function() {
      worker.stop()
      done()
    })
  })

  it('processes job', function(done) {
    worked.job(queueName, {name: 'Brian'}, function(err) {
      assert.ifError(err)
      var worker = worked.worker(queueName, function(job) {
        assert.equal(job.data.name, 'Brian')
        done()
      })
    })
  })
})
