#!/usr/bin/env ruby
# frozen_string_literal: true

require 'appmap'
require 'jwt'

def record(name, &block)
  data = AppMap.record { block.call }
  File.write("tmp/appmap/#{name}.appmap.json", data.to_json)
end

key = 'test'
jwt_example = JWT.encode({ key: 'value' }, key)

record('JWT.encode_no_signature') { JWT.encode({ key: 'value' }, nil) }
record('JWT.encode_signature') { JWT.encode({ key: 'value' }, key) }
record('JWT.encode_none_alg') { JWT.encode({ key: 'value' }, nil, 'none') }
record('JWT.decode_no_validation') { JWT.decode(jwt_example, key, false) }
record('JWT.decode_validation') { JWT.decode(jwt_example, key, true) }
