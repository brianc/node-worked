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

var urls = {}
var getUrl = function(queue, cb) {
  if(urls[queue]) {
    return cb(null, urls[queue])
  }
  var options = {
    QueueName: queue
  }
  sqs.getQueueUrl(options, ok(cb, function(res) {
    urls[queue] = res.QueueUrl
    cb(null, res.QueueUrl)
  }))
}

var Queue = function(name) {
  this.name = name
}

Queue.prototype.pop = function(timeout, cb) {
  getUrl(this.name, ok(cb, function(url) {
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
  getUrl(name, ok(cb, function(url) {
    sqs.deleteQueue({QueueUrl: url}, cb)
  }))
}

Queue.create = function(name, options, cb) {
  sqs.createQueue({
    QueueName: name,
    Attributes: options
  }, cb)
}

Queue.prototype.push = function(body, cb) {
  getUrl(this.name, ok(cb, function(url) {
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
  getUrl(this.name, ok(cb, function(url) {
    var options = {
      QueueUrl: url,
      ReceiptHandle: item.receipt
    }
    sqs.deleteMessage(options, cb)
  }))
}

module.exports = Queue
