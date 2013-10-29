var Queue = require('./queue')
var logged = require('logged')
var EventEmitter = require('events').EventEmitter
var util = require('util')
var Job = require('./job')

var Worker = module.exports = function(queueName) {
  EventEmitter.call(this)
  this.queue = new Queue(queueName)
  this.started = false
  this.log = logged({
    worker: Worker.count++,
    queue: queueName
  })
}

util.inherits(Worker, EventEmitter)

Worker.count = 0

Worker.prototype.start = function() {
  if(this.started) return;
  this.started = true
  this._next()
  return this
}

Worker.prototype.stop = function() {
  if(!this.started) return;
  this.started = false
}

Worker.prototype._next = function() {
  if(!this.started) return;
  var self = this
  this.queue.pop(1, function(err, res) {
    if(err) {
      self.log.error('queue.pop failed', {error: err})
      return setTimeout(function() {
        self._next()
      }, 1000)
    }
    self._process(res)
  })
}

//process raw job objects from the queue
Worker.prototype._process = function(jobs) {
  if(!this.started) return;
  if(!jobs.length) {
    this.emit('idle')
    return this._next()
  }
  var work = []
  for(var i = 0; i < jobs.length; i++) {
    var job = jobs[i]
    work.push(new Job(this, job))
  }
}

Worker.prototype._complete = function(job) {
}

Worker.create = function(queueName, options, workFn) {
  if(typeof options == 'function') {
    workFn = options
    options = {}
  }
  var worker = new Worker(queueName, options)
  worker.work = workFn.bind(worker)
  return worker.start()
}
