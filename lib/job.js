var Queue = require('./queue')

var Job = module.exports = function(worker, data) {
  this.queue = worker.queue
  this.data = data
}

Job.create = function(queueName, data, options, cb) {
  if(typeof options == 'function') {
    cb = options
    options = {}
  }
  cb = cb || function() { }
  new Queue(queueName).push(JSON.stringify(data), function(err) {
    cb(err)
  })
}
