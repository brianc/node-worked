var Worker = require('./lib/worker')
var Job = require('./lib/job')
var Queue = require('./lib/queue')

module.exports = {
  worker: Worker.create,
  job: Job.create,
  Worker: Worker,
  Job: Job,
  Queue: Queue
}
