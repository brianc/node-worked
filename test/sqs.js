var assert = require('assert')

var ok = require('okay')

var Queue = require('../lib/queue')

var queuePrefix = 'sqs-test'
var queueName = queuePrefix + Date.now()

describe('existing queue', function() {
  before(function(done) {
    Queue.delete(queueName, function(err) {
      var options = {
      }
      Queue.create(queueName, options, done)
    })
  })

  it('pushing works', function(done) {
    var queue = new Queue(queueName)
    queue.push('whatever', function(err, res) {
      assert.ifError(err)
      assert(res.id)
      done()
    })
  })

  describe('popping', function() {
    it('works', function(done) {
      var queue = new Queue(queueName)
      queue.pop(function(err, msgs) {
        assert.ifError(err)
        assert.equal(msgs.length, 1)
        assert.equal(msgs[0].body, 'whatever')
        done()
      })
    })
  })

  describe('popping on empty', function() {
    it('times out', function(done) {
      var queue = new Queue(queueName)
      queue.pop(function(err, msgs) {
        assert.ifError(err)
        assert.equal(msgs.length, 0)
        done()
      })
    })
  })

  describe('delete', function() {
    it('works', function(done) {
      this.timeout(5000)
      var queue = new Queue(queueName)
      queue.push('work!', ok(done, function() {
        queue.pop(ok(done, function(items) {
          assert.equal(items.length, 1)
          queue.delete(items[0], ok(done, function() {
            queue.pop(ok(done, function(items) {
              assert.equal(items.length, 0)
              done()
            }))
          }))
        }))
      }))
    })
  })
})

describe('missing queue', function() {
  it('push returns error', function(done) {
    var queue = new Queue('asdf')
    queue.push('whatever', function(err, res) {
      assert(err)
      done()
    })
  })
})

