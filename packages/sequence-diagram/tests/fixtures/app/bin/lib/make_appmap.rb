ENV['APPMAP'] = 'true'

require 'appmap'
require 'fileutils'
require 'byebug'

tracer = AppMap.tracing.trace
tracer.enable

at_exit do
  tracer.disable
  metadata = AppMap.detect_metadata
  name = $PROGRAM_NAME.split('.', 2)[0].split('/')[-1]
  metadata[:name] = name
  events = tracer.events.map(&:to_h)
  class_map = AppMap.class_map tracer.event_methods
  appmap = { metadata: metadata, classMap: class_map, events: events }
  FileUtils.mkdir_p 'tmp/appmap'
  File.write("tmp/appmap/#{name.gsub(/[^a-zA-Z0-9\-_]/, '_')}.appmap.json", JSON.pretty_generate(appmap))
end
