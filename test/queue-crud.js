var assert = require('assert')

var ok = require('okay')

var Queue = require('../lib/queue')

var queuePrefix = 'sqs-test'
var queueName = queuePrefix + Date.now()

describe('detele all', function() {
  it('creates a queue', function(done) {
    Queue.create(queueName, {}, ok(done, function(queue) {
      assert(queue)
      assert(queue instanceof Queue, 'should be instance of queue')
      assert.equal(queue.name, queueName)
      assert(queue.url)
      done()
    }))
  })

  it('lists queues with prefix', function(done) {
    Queue.list(queuePrefix, ok(done, function(res) {
      assert(res.length >= 1, 'should have at least one queue')
      res.forEach(function(url) {
        assert(url.indexOf(queuePrefix) > -1)
      })
      done()
    }))
  })

  it('deletes all queues with prefix', function(done) {
    Queue.deleteAll(queuePrefix, ok(done, function(res) {
      done()
    }))
  })
})
