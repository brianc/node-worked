var _ = require('lodash')
var AWS = require('aws-sdk')

var ok = require('okay')

var options = {
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  region: 'us-east-1',
  apiVersion: '2012-11-05'
}

var sqs = new AWS.SQS(options)

var Queue = function(name, url) {
  this.name = name
  this.url = url
  if(!this.name) {
    this.name = (url||'').split('/').pop()
  }
}

var urls = {}
Queue.prototype._getUrl = function(cb) {
  var self = this

  if(this.url) {
    urls[this.name] = this.url
    return cb(null, this.url)
  }

  if(urls[this.name]) {
    this.url = urls[this.name]
    return cb(null, this.url)
  }

  var options = {
    QueueName: this.name
  }

  sqs.getQueueUrl(options, ok(cb, function(res) {
    self.url = res.QueueUrl
    return self._getUrl(cb)
  }))
}

Queue.prototype.pop = function(timeout, cb) {
  this._getUrl(ok(cb, function(url) {
    if(typeof timeout === 'function') {
      cb = timeout
      timeout = 1
    }
    var options = {
      QueueUrl: url,
      WaitTimeSeconds: timeout
    }
    sqs.receiveMessage(options, ok(cb, function(res) {
      var messages = []

      if(!res.Messages) {
        return cb(null, [])
      }

      for(var i = 0; i < res.Messages.length; i++) {
        var msg = res.Messages[i]
        messages.push({
          body: msg.Body,
          receipt: msg.ReceiptHandle,
          id: msg.MessageId
        })
      }
      cb(null, messages)
    }))
  }))
}

Queue.delete = function(name, cb) {
  this._getUrl(ok(cb, function(url) {
    sqs.deleteQueue({QueueUrl: url}, cb)
  }))
}

Queue.create = function(name, options, cb) {
  var options = {
    QueueName: name,
    Attributes: options
  }
  sqs.createQueue(options, ok(cb, function(res) {
    return cb(null, new Queue(null, res.QueueUrl))
  }))
}

Queue.list = function(prefix, cb) {
  var options = {
    QueueNamePrefix: prefix
  }
  sqs.listQueues(options, ok(cb, function(res) {
    cb(null, res.QueueUrls || [])
  }))
}

Queue.delete = function(url, cb) {
  sqs.deleteQueue({QueueUrl: url}, cb)
}

var assert = require('assert')
var async = require('async')
Queue.deleteAll = function(prefix, cb) {
  if(!prefix) {
    var msg =  'Sorry, you did not provide a prefix and I will not delete everything for you'
    cb(new Error(msg))
  }
  Queue.list(prefix, ok(cb, function(res) {
    async.forEach(res, Queue.delete, cb)
  }))
}

Queue.prototype.push = function(body, cb) {
  this._getUrl(ok(cb, function(url) {
    var options = {
      QueueUrl: url,
      MessageBody: body
    }
    sqs.sendMessage(options, ok(cb, function(res) {
      cb(null, {id: res.MessageId})
    }))
  }))
}

Queue.prototype.delete = function(item, cb) {
  this._getUrl(ok(cb, function(url) {
    var options = {
      QueueUrl: url,
      ReceiptHandle: item.receipt
    }
    sqs.deleteMessage(options, cb)
  }))
}

module.exports = Queue
